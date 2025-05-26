import { ChatBody } from '@/types/chat';
import { delay } from '@/utils/app/helper';

// # modify by Rose
// 全局提醒数据存储 - 修复数据引用问题，避免状态污染
let globalReminders = [
  {
    id: "1",
    title: "服用降压药",
    time: "08:00",
    type: "medicine",
    description: "早餐后服用一片",
    isCompleted: false,
  },
  {
    id: "2",
    title: "午餐",
    time: "12:00",
    type: "meal",
    description: "记得多吃蔬菜",
    isCompleted: false,
  },
  {
    id: "3",
    title: "服用降糖药",
    time: "19:00",
    type: "medicine",
    description: "晚餐后服用一片",
    isCompleted: false,
  },
  {
    id: "4",
    title: "睡觉",
    time: "22:00",
    type: "sleep",
    description: "记得关灯",
    isCompleted: false,
  },
];
// # end

export const config = {
  runtime: 'edge',
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};


const handler = async (req: Request): Promise<Response> => {

  // extract the request body
  let {
    chatCompletionURL = '',
    messages = [],
    additionalProps = {
      enableIntermediateSteps: true
    }
  } = (await req.json()) as ChatBody;

  try {    
    let payload
    // for generate end point the request schema is {input_message: "user question"}
    if(chatCompletionURL.includes('generate')) {  
      if (messages?.length > 0 && messages[messages.length - 1]?.role === 'user') {
        payload = {
          input_message: messages[messages.length - 1]?.content ?? ''
        };
      } else {
        throw new Error('User message not found: messages array is empty or invalid.');
      }
    }

    // for chat end point it is openAI compatible schema
    else {
      payload = {
        messages,
        model: "string",
        temperature: 0,
        max_tokens: 0,
        top_p: 0,
        use_knowledge_base: true,
        top_k: 0,
        collection_name: "string",
        stop: true,
        additionalProp1: {}
      }
    }

    console.log('aiq - making request to', { url: chatCompletionURL });

    let response = await fetch(chatCompletionURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('aiq - received response from server', response.status);

    if (!response.ok) {
      let errorMessage = await response.text();

      if(errorMessage.includes('<!DOCTYPE html>')) {
        if(errorMessage.includes('404')) {
          errorMessage = '404 - Page not found'
        }
        else {
          errorMessage = 'HTML response received from server, which cannot be parsed.'
        }
        
      }
      console.log('aiq - received error response from server', errorMessage);
      // For other errors, return a Response object with the error message
      const formattedError = `Something went wrong. Please try again. \n\n<details><summary>Details</summary>Error Message: ${errorMessage || 'Unknown error'}</details>`
      return new Response(formattedError, {
        status: 200, // Return 200 status
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }, // Set appropriate content type with charset
      });
    }


    // response handling for streaming schema
    if (chatCompletionURL.includes('stream')) {
      console.log('aiq - processing streaming response');
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');

      // 跟踪最终回答，用于添加到流的末尾
      let finalAnswer = '';
      // 跟踪是否已经找到了最终答案
      let finalAnswerFound = false;

      const responseStream = new ReadableStream({
        async start(controller) {
          const reader = response?.body?.getReader();
          let buffer = '';
          let counter = 0
          try {
            while (true) {
              const { done, value } = await reader?.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                // 处理常规数据行
                if (line.startsWith('data: ')) {
                  const data = line.slice(5);
                  if (data.trim() === '[DONE]') {
                    // 如果找到了最终答案，在结束前发送它
                    if (finalAnswer && !finalAnswerFound) {
                      controller.enqueue(encoder.encode(finalAnswer));
                      finalAnswerFound = true;
                    }
                    controller.close();
                    return;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    let content = parsed.choices[0]?.message?.content || parsed.choices[0]?.delta?.content || '';
                    if (content) {
                      // 检查是否包含最终答案
                      if (content.includes('Final Answer:')) {
                        // 修改：直接提取Final Answer后的内容，而不是包含前缀
                        const match = content.match(/Final Answer:\s*(.*?)(?:$|")/);
                        if (match && match[1]) {
                          content = match[1].trim(); // 只使用匹配到的内容部分
                        }
                      }
                      // 检查编码问题，确保是干净的文本
                      const sanitizedContent = content.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
                      if (!finalAnswerFound) { // 只有在没找到最终答案时才发送常规内容
                        controller.enqueue(encoder.encode(sanitizedContent));
                      }
                    }
                  } catch (error) {
                    console.log('aiq - error parsing JSON:', error);
                  }
                }
                
                // 中间步骤处理
                if (line.startsWith('intermediate_data: ')) {
                  if(additionalProps.enableIntermediateSteps === true) {
                    const data = line.split('intermediate_data: ')[1];
                    if (data.trim() === '[DONE]') {
                      if (finalAnswer && !finalAnswerFound) {
                        controller.enqueue(encoder.encode(finalAnswer));
                        finalAnswerFound = true;
                      }
                      controller.close();
                      return;
                    }
                    try {
                      const payload = JSON.parse(data);
                      let details = payload?.payload || 'No details';
                      let name = payload?.name || 'Step';
                      let id = payload?.id || '';
                      let status = payload?.status || 'in_progress';
                      let error = payload?.error || '';
                      let type = 'system_intermediate';
                      let parent_id = payload?.parent_id || 'default';
                      let intermediate_parent_id = payload?.intermediate_parent_id || 'default';
                      let time_stamp = payload?.time_stamp || 'default';

                      // 检查这个中间步骤是否包含最终答案
                      if (typeof details === 'string' && details.includes('Final Answer:')) {
                        const match = details.match(/Final Answer:\s*(.*?)(?:$|"|\n)/);
                        if (match && match[1]) {
                          finalAnswer = match[1].trim();
                          // 注意：这里不设置finalAnswerFound，让最终答案在流结束时发送
                        }
                      }

                      const intermediate_message = {
                        id,
                        status,
                        error,
                        type,
                        parent_id,
                        intermediate_parent_id,
                        content: {
                          name: name,
                          payload: details,          
                        },
                        time_stamp,
                        index: counter++
                      };
                      const messageString = `<intermediatestep>${JSON.stringify(intermediate_message)}</intermediatestep>`;
                      controller.enqueue(encoder.encode(messageString));
                    } catch (error) {
                      console.log('aiq - error parsing intermediate data JSON:', error);
                      // 不向客户端发送解析错误
                    }
                  }
                }
              }
            }
            
            // 流结束时，如果找到了最终答案但尚未发送，则发送它
            if (finalAnswer && !finalAnswerFound) {
              controller.enqueue(encoder.encode(finalAnswer));
            }
          } catch (error) {
            console.log('aiq - stream reading error, closing stream', error);
            controller.close();
          } finally {
            console.log('aiq - response processing is completed, closing stream');
            controller.close();
            reader?.releaseLock();
          }
        },
      });

      return new Response(responseStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // response handling for non straming schema
    else {
      console.log('aiq - processing non streaming response');
      const data = await response.text();
      let parsed = null;
    
      try {
        parsed = JSON.parse(data);
      } catch (error) {
        console.log('aiq - error parsing JSON response, returning raw text', error);
        // 如果解析失败，返回纯文本但确保它是有效的UTF-8
        return new Response(data, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    
      // 提取内容并确保它是有效的文本
      let content;
      
      // 尝试检测"Final Answer:"格式
      if (typeof parsed === 'object') {
        // 在各种可能的字段中查找最终答案
        const checkForFinalAnswer = (text) => {
          if (typeof text === 'string' && text.includes('Final Answer:')) {
            const match = text.match(/Final Answer:\s*(.*?)(?:$|"|\n)/);
            if (match && match[1]) {
              return match[1].trim();
            }
          }
          return null;
        };
        
        // 检查各种可能包含最终答案的字段
        const finalAnswer = 
          checkForFinalAnswer(parsed.output) || 
          checkForFinalAnswer(parsed.answer) || 
          checkForFinalAnswer(parsed.value) ||
          (Array.isArray(parsed.choices) && parsed.choices[0]?.message?.content && 
           checkForFinalAnswer(parsed.choices[0].message.content));
        
        // 如果找到最终答案，使用它
        if (finalAnswer) {
          content = finalAnswer;
        } else {
          // 否则使用常规字段
          if (parsed?.output) content = parsed.output;
          else if (parsed?.answer) content = parsed.answer;
          else if (parsed?.value) content = parsed.value;
          else if (Array.isArray(parsed?.choices) && parsed.choices[0]?.message?.content) 
            content = parsed.choices[0].message.content;
          else if (typeof parsed === 'object') 
            content = JSON.stringify(parsed);
          else 
            content = data;
        }
      } else {
        content = data;
      }
      
      // 清理可能的乱码字符
      const sanitizedContent = typeof content === 'string' 
        ? content.replace(/[\uFFFD\uFFFE\uFFFF]/g, '') 
        : String(content);
    
      console.log('aiq - response processing is completed');
      return new Response(sanitizedContent, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
  } catch (error) {
    console.log('error - while making request', error);
    const formattedError = `Something went wrong. Please try again. \n\n<details><summary>Details</summary>Error Message: ${error?.message || 'Unknown error'}</details>`
    return new Response(formattedError, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
};

export default handler;

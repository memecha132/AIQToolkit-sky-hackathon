import logging

from pydantic import Field

from aiq.builder.builder import Builder
from aiq.builder.function_info import FunctionInfo
from aiq.cli.register_workflow import register_function
from aiq.data_models.function import FunctionBaseConfig
from aiq.data_models.component_ref import EmbedderRef
from aiq.builder.framework_enum import LLMFrameworkEnum
import subprocess
from typing import Optional
logger = logging.getLogger(__name__)


class AlzChaterFunctionConfig(FunctionBaseConfig, name="Alz_chater"):
    """
    AIQ Toolkit function template. Please update the description.
    """
    # Add your custom configuration parameters here
    parameter: str = Field(default="default_value", description="Notional description for this parameter")


@register_function(config_type=AlzChaterFunctionConfig)
async def Alz_chater_function(
    config: AlzChaterFunctionConfig, builder: Builder
):
    # Implement your function logic here
    async def _response_fn(input_message: str) -> str:
        # Process the input_message and generate output
        output_message = f"Hello from Alz_chater workflow! You said: {input_message}"
        return output_message

    try:
        yield FunctionInfo.create(single_fn=_response_fn)
    except GeneratorExit:
        print("Function exited early!")
    finally:
        print("Cleaning up Alz_chater workflow.")

class WeChatSenMsgConfig(FunctionBaseConfig, name="wechat_message_sender"):
    """微信工具配置类"""
    pass


@register_function(config_type=WeChatSenMsgConfig)
async def wechat_message_sender(config: WeChatSenMsgConfig, builder: Builder):

    import re
    import subprocess

    async def _send_wechat_message(text: str) -> str:
        applescript = f'''
        tell application "WeChat" to activate
        delay 0.5
        set pasteText to "文件传输助手"
        set the clipboard to pasteText
        tell application "System Events"
            key code 3 using command down
            delay 0.5
            key code 9 using command down
            delay 0.5
            key code 36
            delay 0.5
            key code 36
            delay 0.5
            set pasteText to "{text}"
            set the clipboard to pasteText
            delay 1.5
            key code 9 using command down
            delay 0.5
            key code 36
        end tell
        '''
        
        try:
            result = subprocess.run(
                ['osascript', '-e', applescript],
                capture_output=True,
                text=True,
                check=True
            )
            return f"成功发送消息: {text}"
        except subprocess.CalledProcessError as e:
            return f"执行脚本时出错: {e.stderr}"
        except Exception as e:
            return f"发生未知错误: {e}"

    # 创建可用于任何支持的LLM框架的通用AIQ工具包工具
    yield FunctionInfo.from_fn(
        _send_wechat_message,
        description=("这是一个用于在微信中发送消息的工具。"
                     "它接收一段文本作为输入，并将该文本发送给微信中的'文件传输助手'。"))


class WeChatToolConfig(FunctionBaseConfig, name="wechat_telephone_tool"):
    """微信工具配置类"""
    pass
@register_function(config_type=WeChatToolConfig)
async def wechat_telephone_tool(config: WeChatToolConfig, builder: Builder):

    import re
    import subprocess

    async def _wechat_telephone(recipient: str) -> str:
        applescript = f'''
        tell application "WeChat" to activate
        delay 0.5
        set pasteText to "{recipient}"
        set the clipboard to pasteText
        tell application "System Events"
            key code 3 using command down
            delay 0.5
            key code 9 using command down
            delay 0.5
            key code 36
            delay 0.5
            key code 36
            delay 0.5
            
            tell process "WeChat"
                tell window "微信 (聊天)"
                    tell splitter group 1
                        tell splitter group 1
                            click button 6
                        end tell
                    end tell
                end tell
            end tell
        end tell
        '''
        
        try:
            result = subprocess.run(
                ['osascript', '-e', applescript],
                capture_output=True,
                text=True,
                check=True
            )
            return f"成功向 {recipient} 发起微信语音通话"
        except subprocess.CalledProcessError as e:
            return f"执行脚本时出错: {e.stderr}"
        except Exception as e:
            return f"发生未知错误: {e}"

    # 创建可用于任何支持的LLM框架的通用AIQ工具包工具
    yield FunctionInfo.from_fn(
        _wechat_telephone,
        description=("这是一个用于在微信中发起语音通话的工具。"
                     "它接收一个联系人名称作为输入，并尝试向该联系人发起微信语音通话。"))
    
class LocalTimeConfig(FunctionBaseConfig, name="local_time_fetcher"):
    """获取本地的时间"""
    pass
@register_function(config_type=LocalTimeConfig)
async def local_time_fetcher(config: LocalTimeConfig, builder: Builder):

    from datetime import datetime

    async def _local_search_mcp(text: str) -> str:
        """获取当前本地时间

        Args:
            text: 占位参数，实际不使用

        Returns:
            str: YYYY:MM:DD HH:MM:SS
        """
        # 获取当前本地时间
        current_time = datetime.now().strftime("%Y:%m:%d %H:%M:%S")
        # 返回搜索结果  
        return current_time

    # 创建可用于任何支持的LLM框架的通用AIQ工具包工具
    yield FunctionInfo.from_fn(
        _local_search_mcp,
        description=("这是一个用于获取当前本地时间的工具。"
                     "它不依赖输入文本，直接返回系统当前时间，格式为YYYY:MM:DD HH:MM:SS。"))



class WebQueryToolConfig(FunctionBaseConfig, name="webpage_query"):
    webpage_url: str
    description: str
    chunk_size: int = 256
    embedder_name: EmbedderRef = "nvidia/nv-embedqa-e5-v5"


@register_function(config_type=WebQueryToolConfig)
async def webquery_tool(config: WebQueryToolConfig, builder: Builder):

    from langchain.tools.retriever import create_retriever_tool
    from langchain_community.document_loaders import WebBaseLoader
    from langchain_community.vectorstores import FAISS
    from langchain_core.embeddings import Embeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    logger.info("Generating docs for the webpage: %s", config.webpage_url)

    embeddings: Embeddings = await builder.get_embedder(config.embedder_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    loader = WebBaseLoader(config.webpage_url)

    # Cant use `aload` because its implemented incorrectly and is not async
    docs = [document async for document in loader.alazy_load()]

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=config.chunk_size)
    documents = text_splitter.split_documents(docs)
    vector = await FAISS.afrom_documents(documents, embeddings)

    retriever = vector.as_retriever()

    retriever_tool = create_retriever_tool(
        retriever,
        "webpage_search",
        config.description,
    )

    async def _inner(query: str) -> str:

        return await retriever_tool.arun(query)

    yield FunctionInfo.from_fn(_inner, description=config.description)

# modify by Rose
class MacReminderConfig(FunctionBaseConfig, name="mac_reminder_tool"):
    """Mac提醒事项工具配置类"""
    pass


@register_function(config_type=MacReminderConfig)
async def mac_reminder_tool(config: MacReminderConfig, builder: Builder):
    """Mac提醒事项工具，用于在Mac的提醒事项应用中创建提醒"""
    
    import re
    import subprocess
    from datetime import datetime, timedelta

    async def _create_mac_reminder(title: str, notes: str = "", due_date: str = "") -> str:
        """
        在Mac提醒事项中创建新的提醒
        
        Args:
            title: 提醒标题
            notes: 提醒备注（可选）
            due_date: 到期日期，格式为 "YYYY-MM-DD HH:MM"（可选）
        
        Returns:
            str: 操作结果信息
        """
        try:
            # 构建AppleScript命令
            applescript_parts = [
                'tell application "Reminders"',
                '    tell default list',  # 使用默认列表而不是指定名称
                f'        set newReminder to make new reminder with properties {{name:"{title}"}}'
            ]
            
            # 如果有备注，添加备注
            if notes:
                applescript_parts.append(f'        set body of newReminder to "{notes}"')
            
            # 如果有到期日期，添加到期日期
            if due_date:
                try:
                    # 解析日期格式
                    if " " in due_date:
                        # 包含时间 - 使用更简单的格式
                        date_obj = datetime.strptime(due_date, "%Y-%m-%d %H:%M")
                        # 使用更兼容的日期格式
                        date_str = f'(current date) + (0 * days)'
                        # 设置具体的日期和时间
                        year = date_obj.year
                        month = date_obj.month
                        day = date_obj.day
                        hour = date_obj.hour
                        minute = date_obj.minute
                        
                        applescript_parts.append(f'        set targetDate to current date')
                        applescript_parts.append(f'        set year of targetDate to {year}')
                        applescript_parts.append(f'        set month of targetDate to {month}')
                        applescript_parts.append(f'        set day of targetDate to {day}')
                        applescript_parts.append(f'        set hours of targetDate to {hour}')
                        applescript_parts.append(f'        set minutes of targetDate to {minute}')
                        applescript_parts.append(f'        set seconds of targetDate to 0')
                        applescript_parts.append(f'        set due date of newReminder to targetDate')
                    else:
                        # 只有日期
                        date_obj = datetime.strptime(due_date, "%Y-%m-%d")
                        year = date_obj.year
                        month = date_obj.month
                        day = date_obj.day
                        
                        applescript_parts.append(f'        set targetDate to current date')
                        applescript_parts.append(f'        set year of targetDate to {year}')
                        applescript_parts.append(f'        set month of targetDate to {month}')
                        applescript_parts.append(f'        set day of targetDate to {day}')
                        applescript_parts.append(f'        set hours of targetDate to 9')
                        applescript_parts.append(f'        set minutes of targetDate to 0')
                        applescript_parts.append(f'        set seconds of targetDate to 0')
                        applescript_parts.append(f'        set due date of newReminder to targetDate')
                        
                except ValueError:
                    # 如果日期格式不正确，跳过设置到期日期
                    pass
            
            applescript_parts.extend([
                '    end tell',
                'end tell'
            ])
            
            applescript = '\n'.join(applescript_parts)
            
            # 执行AppleScript
            result = subprocess.run(
                ['osascript', '-e', applescript],
                capture_output=True,
                text=True,
                check=True
            )
            
            return f"成功在Mac提醒事项中创建提醒: {title}"
            
        except subprocess.CalledProcessError as e:
            return f"创建Mac提醒时出错: {e.stderr}"
        except Exception as e:
            return f"发生未知错误: {str(e)}"

    # 创建AIQ工具包工具
    yield FunctionInfo.from_fn(
        _create_mac_reminder,
        description=("这是一个用于在Mac提醒事项应用中创建提醒的工具。"
                     "它接收提醒标题、备注和到期日期作为输入，并在Mac的提醒事项应用中创建对应的提醒。"
                     "到期日期格式为 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:MM'。")
    )
# end modify by Rose
class WeChatSenMLocationConfig(FunctionBaseConfig, name="wechat_location_sender"):
    """微信工具配置类"""
    pass
@register_function(config_type=WeChatSenMLocationConfig)
async def wechat_location_sender(config: WeChatSenMLocationConfig, builder: Builder):

    import re
    import subprocess

    async def _send_location_to_guardian(location_name: str) -> str:
        """获取当前定位的链接并发送给微信中的监护人"""
        
        # 构造AppleScript脚本 - 先获取位置链接，再发送给监护人
        applescript = f'''
                tell application "Google Chrome"
            activate
            tell active tab of window 1
                execute javascript "

                            Array.from(document.querySelectorAll('button'))
                                .find(btn => btn.textContent.includes('获取当前位置'))
                                .click();

                            setTimeout(() => {{
            
                                Array.from(document.querySelectorAll('button'))
                                    .find(btn => btn.textContent.includes('复制位置链接'))
                                    .click();
                            }}, 2000);
                        "
            end tell
        end tell

        delay 1
        set originalClipboard to the clipboard
        tell application "WeChat" to activate
        delay 0.5


        set guardianName to "监护人"
        set the clipboard to guardianName
        tell application "System Events"
            key code 3 using command down
            delay 0.5
            key code 9 using command down
            delay 0.5
            key code 36
            delay 0.5
            
            set the clipboard to originalClipboard
            delay 0.5
            key code 9 using command down
            delay 0.5
            key code 36
        end tell
        '''
        
        try:
            # 执行AppleScript脚本
            result = subprocess.run(
                ['osascript', '-e', applescript],
                capture_output=True,
                text=True,
                check=True
            )
            return f"成功将位置链接发送给监护人了"
        except subprocess.CalledProcessError as e:
            return f"执行脚本时出错: {e.stderr}"
        except Exception as e:
            return f"发生未知错误: {e}"

    # 创建可用于任何支持的LLM框架的通用AIQ工具包工具
    yield FunctionInfo.from_fn(
        _send_location_to_guardian,
        description=("这是一个用于获取位置链接并发送给微信监护人的工具。"
                     "它不接收参数输入，在地图应用中获取定位链接后，"
                     "然后将链接发送给微信中指定的监护人。"))
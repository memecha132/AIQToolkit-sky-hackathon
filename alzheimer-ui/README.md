# 阿尔茨海默症智能陪伴机器人 - UI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![AIQ Toolkit](https://img.shields.io/badge/AIQToolkit-Frontend-green)](https://github.com/NVIDIA/AIQToolkit/tree/main)

这是基于[AIQ Toolkit](https://github.com/NVIDIA/AIQToolkit/tree/main)开发的阿尔茨海默症智能陪伴机器人前端界面，专为阿尔茨海默症患者设计，提供友好、简单的交互体验。

本项目基于以下开源项目改造:
- [chatbot-ui](https://github.com/mckaywrigley/chatbot-ui) by Mckay Wrigley
- [chatbot-ollama](https://github.com/ivanfioravanti/chatbot-ollama) by Ivan Fioravanti

## 特性
- 🎨 简洁、大字体、暖色调界面设计，适合老年人使用
- 🎤 语音输入输出功能，支持放慢语速和重复确认
- 💭 情绪检测与安抚功能，提供积极支持
- 📸 记忆回溯服务，展示家庭照片和往事回忆
- ⏰ 日常提醒功能（吃药、吃饭、睡觉等）
- 📍 定位共享功能，定期向监护人发送位置
- 📞 紧急呼叫功能，一键联系监护人
- 🎵 舒缓背景音乐，创造安心环境
- 📝 自动日志记录和分析功能

## Getting Started

### Prerequisites
- [AIQ Toolkit](https://github.com/NVIDIA/AIQToolkit/tree/main) installed and configured
- Git
- Node.js (v18 or higher)
- npm or Docker

### Installation

Clone the repository:
```bash
git clone git@github.com:NVIDIA/AIQToolkit.git
cd AIQToolkit
```

Install dependencies:
```bash
npm ci
```

### Running the Application

#### Local Development
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

#### Docker Deployment
```bash
# Build the Docker image
docker build -t AIQ Toolkit-UI .

# Run the container with environment variables from .env
# Ensure the .env file is present before running this command.
# Skip --env-file .env if no overrides are needed.
docker run --env-file .env -p 3000:3000 AIQ Toolkit-UI
```

![AIQ Toolkit Web User Interface](public/screenshots/ui_home_page.png)

## Configuration

### HTTP API Connection
Settings can be configured by selecting the `Settings` icon located on the bottom left corner of the home page.

![AIQ Toolkit Web UI Settings](public/screenshots/ui_generate_example_settings.png)

### Settings Options
NOTE: Most of the time, you will want to select /chat/stream for intermediate results streaming.

- `Theme`: Light or Dark Theme
- `HTTP URL for Chat Completion`: REST API endpoint
  - /generate - Single response generation
  - /generate/stream - Streaming response generation
  - /chat - Single response chat completion
  - /chat/stream - Streaming chat completion
- `WebSocket URL for Completion`: WebSocket URL to connect to running AIQ Toolkit server
- `WebSocket Schema`: Workflow schema type over WebSocket connection

## Usage Examples

### Simple Calculator Example

#### Setup and Configuration
1. Set up [AIQ Toolkit Get Started ](https://github.com/NVIDIA/AIQToolkit/blob/main/docs/source/intro/get-started.md)
2. Start workflow by following the [Simple Calculator Example](https://github.com/NVIDIA/AIQToolkit/blob/main/examples/simple_calculator/README.md)
```bash
aiq serve --config_file=examples/simple_calculator/configs/config.yml
```

#### Testing the Calculator
Interact with the chat interface by prompting the agent with the message:
```
Is 4 + 4 greater than the current hour of the day?
```

![AIQ Toolkit Web UI Workflow Result](public/screenshots/ui_generate_example.png)

## API Integration

### Server Communication
The UI supports both HTTP requests (OpenAI compatible) and WebSocket connections for server communication. For detailed information about WebSocket messaging integration, please refer to the [WebSocket Documentation](https://github.com/NVIDIA/AIQToolkit/blob/main/docs/source/references/websockets.md) in the AIQ Toolkit documentation.



## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. The project includes code from [chatbot-ui](https://github.com/mckaywrigley/chatbot-ui) and [chatbot-ollama](https://github.com/ivanfioravanti/chatbot-ollama), which are also MIT licensed.


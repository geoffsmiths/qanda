# AI Question Answerer Chrome Extension

A Chrome extension that uses AI to analyze questions and answers on web pages. The extension captures screenshots of questions and provides AI-powered analysis of the content.

## Features

- Capture and analyze questions from any webpage
- AI-powered analysis of questions and answers
- Stores recent analyses for quick reference
- Secure API key management through extension settings

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/geoffsmiths/qanda.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Setup

1. Get an OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)

2. Configure the extension:
   - Right-click the extension icon in Chrome
   - Select "Options"
   - Enter your OpenAI API key
   - Click "Save Settings"

## Usage

1. Navigate to any webpage containing questions
2. Click the extension icon
3. Click "Analyze" to capture and analyze the current page
4. View the AI's analysis of the question and answers

## Security

- API keys are stored securely in Chrome's local storage
- No API keys are stored in the source code
- All API requests are made directly from the user's browser

## Development

### Project Structure

- `background.js` - Main extension logic and API communication
- `popup.html/js` - Extension popup interface
- `settings.html/js` - API key configuration
- `manifest.json` - Extension configuration

### Building

No build step is required. The extension can be loaded directly in Chrome's developer mode.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureAndAnalyze') {
    handleCaptureAndAnalyze(request.tabId)
      .then(sendResponse)
      .catch(error => {
        console.error('Error in handleCaptureAndAnalyze:', error);
        sendResponse({ error: error.message });
      });
    return true; // Required for async response
  } else if (request.action === 'getRecentAnalyses') {
    getRecentAnalyses()
      .then(sendResponse)
      .catch(error => {
        console.error('Error in getRecentAnalyses:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function getRecentAnalyses() {
  const result = await chrome.storage.local.get('analyses');
  return result.analyses || [];
}

async function saveImageToFile(base64Image) {
  // Generate unique filename using timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `analysis_${timestamp}.png`;
  
  // Store the image data in chrome.storage.local
  const imageKey = `image_${timestamp}`;
  await chrome.storage.local.set({ [imageKey]: base64Image });
  
  return {
    filename,
    imageKey
  };
}

async function handleCaptureAndAnalyze(tabId) {
  try {
    // Get the current tab
    const tab = await chrome.tabs.get(tabId);
    
    // Check if the URL is accessible
    if (!tab.url || !isValidUrl(tab.url)) {
      throw new Error('Cannot analyze this page. Please try on a regular webpage.');
    }

    // Capture screenshot of the visible area
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });

    // Convert screenshot to base64
    const base64Image = screenshot.replace(/^data:image\/(png|jpg);base64,/, '');

    // Get AI analysis of the screenshot
    const aiResponse = await getAIAnswer(base64Image);
    
    const analysisResult = {
      question: aiResponse.question,
      possibleAnswers: aiResponse.possibleAnswers,
      answer: aiResponse.answer,
      imageUrl: screenshot,
      url: tab.url,
      timestamp: new Date().toISOString()
    };

    try {
      // Store the analysis result
      const result = await chrome.storage.local.get('analyses');
      const analyses = result.analyses || [];
      analyses.unshift(analysisResult); // Add new analysis at the beginning
      
      // Keep only the last 5 analyses to prevent quota issues
      if (analyses.length > 5) {
        // Remove old analyses and their associated images
        const removedAnalyses = analyses.splice(5);
        const keysToRemove = removedAnalyses
          .filter(analysis => analysis.imageKey)
          .map(analysis => analysis.imageKey);
        
        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
        }
      }
      
      await chrome.storage.local.set({ analyses });
    } catch (storageError) {
      console.error('Storage error:', storageError);
      // If we hit a quota error, try to clear some space and retry
      if (storageError.message.includes('QUOTA_BYTES')) {
        // Clear all stored data and try again with just the new analysis
        await chrome.storage.local.clear();
        await chrome.storage.local.set({ analyses: [analysisResult] });
      } else {
        throw storageError;
      }
    }

    return analysisResult;
  } catch (error) {
    console.error('Error in handleCaptureAndAnalyze:', error);
    throw new Error('Failed to capture and analyze: ' + error.message);
  }
}

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // Check if the URL is http or https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

async function getAIAnswer(base64Image) {
  const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  
  // Get API key from Chrome storage
  const result = await chrome.storage.local.get('openai_api_key');
  const API_KEY = result.openai_api_key;

  if (!API_KEY) {
    throw new Error('OpenAI API key not found. Please set your API key in the extension settings.');
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes images containing questions and answers. Your task is to: 1) Identify the main question in the image, 2) List all possible answers shown, 3) Choose the best answer based on the context and any visual information provided."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and provide: 1) The main question, 2) All possible answers shown, 3) The best answer with explanation. If there are multiple questions, focus on the most prominent one."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'AI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the AI response to extract question, answers, and chosen answer
    const lines = content.split('\n');
    let question = '';
    let possibleAnswers = [];
    let answer = '';

    for (const line of lines) {
      if (line.startsWith('Question:')) {
        question = line.replace('Question:', '').trim();
      } else if (line.startsWith('Possible Answers:')) {
        // Skip the header line
        continue;
      } else if (line.match(/^[A-Za-z0-9][.)]\s/)) {
        // This is a possible answer
        possibleAnswers.push(line.trim());
      } else if (line.startsWith('Best Answer:')) {
        answer = line.replace('Best Answer:', '').trim();
      }
    }

    return {
      question,
      possibleAnswers,
      answer
    };
  } catch (error) {
    console.error('Error in getAIAnswer:', error);
    throw new Error('Failed to get AI answer: ' + error.message);
  }
} 
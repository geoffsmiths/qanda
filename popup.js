document.addEventListener('DOMContentLoaded', function() {
  const analyzeButton = document.getElementById('analyzeButton');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const questionDiv = document.getElementById('question');
  const answerDiv = document.getElementById('answer');
  const imageDiv = document.getElementById('image');
  const possibleAnswersDiv = document.getElementById('possibleAnswers');
  const analysesListDiv = document.getElementById('analysesList');

  // Load recent analyses when popup opens
  loadRecentAnalyses();

  clearHistoryButton.addEventListener('click', async () => {
    try {
      // Clear all stored data
      await chrome.storage.local.clear();

      // Clear the UI
      analysesListDiv.innerHTML = '<p>No analyses yet. Click "Analyze Page" to start!</p>';
      statusDiv.textContent = 'History cleared successfully!';
      statusDiv.className = 'success';
      
      // Hide the status message after 2 seconds
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    } catch (error) {
      console.error('Error clearing history:', error);
      statusDiv.textContent = 'Error clearing history';
      statusDiv.className = 'error';
    }
  });

  analyzeButton.addEventListener('click', async () => {
    try {
      // Clear previous results
      statusDiv.textContent = 'Analyzing page...';
      resultDiv.style.display = 'none';
      questionDiv.textContent = '';
      answerDiv.textContent = '';
      imageDiv.innerHTML = '';
      possibleAnswersDiv.innerHTML = '';

      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'captureAndAnalyze',
        tabId: tab.id
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Display results
      displayAnalysisResult(response);
      
      // Reload recent analyses
      loadRecentAnalyses();
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = `Error: ${error.message}`;
    }
  });

  async function loadRecentAnalyses() {
    try {
      const analyses = await chrome.runtime.sendMessage({ action: 'getRecentAnalyses' });
      analysesListDiv.innerHTML = '';

      // Show only the last 3 analyses
      const recentAnalyses = analyses.slice(0, 3);
      
      if (recentAnalyses.length === 0) {
        analysesListDiv.innerHTML = '<p>No analyses yet. Click "Analyze Page" to start!</p>';
        return;
      }

      for (const analysis of recentAnalyses) {
        const analysisItem = document.createElement('div');
        analysisItem.className = 'analysis-item';
        
        const url = document.createElement('div');
        url.className = 'analysis-url';
        url.textContent = analysis.url;
        
        const question = document.createElement('div');
        question.className = 'analysis-question';
        question.textContent = analysis.question;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'analysis-timestamp';
        timestamp.textContent = new Date(analysis.timestamp).toLocaleString();

        // Add the stored image
        const imageContainer = document.createElement('div');
        imageContainer.className = 'analysis-image';
        const img = document.createElement('img');
        img.src = analysis.imageUrl;
        img.alt = 'Analysis screenshot';
        imageContainer.appendChild(img);
        
        analysisItem.appendChild(url);
        analysisItem.appendChild(question);
        analysisItem.appendChild(timestamp);
        analysisItem.appendChild(imageContainer);
        
        // Make the analysis item clickable to show full details
        analysisItem.addEventListener('click', () => {
          displayAnalysisResult(analysis);
        });
        
        analysesListDiv.appendChild(analysisItem);
      }
    } catch (error) {
      console.error('Error loading recent analyses:', error);
      analysesListDiv.innerHTML = '<p>Error loading recent analyses</p>';
    }
  }

  function displayAnalysisResult(analysis) {
    questionDiv.textContent = analysis.question;
    
    // Display possible answers
    if (analysis.possibleAnswers && analysis.possibleAnswers.length > 0) {
      const answersList = document.createElement('ul');
      analysis.possibleAnswers.forEach((answer, index) => {
        const li = document.createElement('li');
        li.textContent = `${String.fromCharCode(65 + index)}) ${answer}`;
        answersList.appendChild(li);
      });
      possibleAnswersDiv.innerHTML = '';
      possibleAnswersDiv.appendChild(answersList);
    }

    // Display AI's answer
    answerDiv.textContent = analysis.answer;

    // Display image if available
    if (analysis.imageUrl) {
      const img = document.createElement('img');
      img.src = analysis.imageUrl;
      img.style.maxWidth = '100%';
      img.style.marginTop = '10px';
      imageDiv.innerHTML = '';
      imageDiv.appendChild(img);
    }

    resultDiv.style.display = 'block';
    statusDiv.textContent = 'Analysis complete!';
  }
}); 
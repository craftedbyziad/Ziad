// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjzp3Tg9bboad032qobHnD_C7lBCxnHUI",
    authDomain: "wetd-773de.firebaseapp.com",
    projectId: "wetd-773de",
    storageBucket: "wetd-773de.firebasestorage.app",
    messagingSenderId: "393874086439",
    appId: "1:393874086439:web:59354bbf1990161a4a0c02",
    measurementId: "G-2MB5VVG0ZK"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Database collections
const linesCollection = db.collection('lines');
const problemsCollection = db.collection('problems');
const repairsCollection = db.collection('repairs');

// Screen Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the selected screen
    document.getElementById(screenId).classList.add('active');
    
    // Special case for repair screen - load active repairs
    if (screenId === 'repair-screen') {
        loadActiveRepairs();
    }
}

// Search functions
async function searchLine() {
    const lineNumber = document.getElementById('search-input').value.trim();
    if (!lineNumber) {
        alert('Please enter a line number');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        const lineDoc = await linesCollection.doc(lineNumber).get();
        
        if (lineDoc.exists) {
            const lineData = lineDoc.data();
            resultsContainer.innerHTML = createLineCard(lineData);
            
            // Store current line data for edit mode
            window.currentLineData = lineData;
            window.currentLineId = lineNumber;
            
            // Enable edit button
            document.getElementById('edit-button').style.display = 'block';
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No line found with number: ${lineNumber}</p>
                </div>
            `;
            // Hide edit button
            document.getElementById('edit-button').style.display = 'none';
        }
    } catch (error) {
        console.error("Error searching for line:", error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Create line result card HTML
function createLineCard(lineData) {
    const installDate = lineData.installationDate ? new Date(lineData.installationDate).toLocaleDateString() : 'N/A';
    
    return `
        <div class="line-card">
            <h3>Line Information</h3>
            <p><strong>Line Number:</strong> <span>${lineData.lineNumber || 'N/A'}</span></p>
            <p><strong>Port:</strong> <span>${lineData.port || 'N/A'}</span></p>
            <p><strong>Cabinet:</strong> <span>${lineData.cabinet || 'N/A'}</span></p>
            <p><strong>Test:</strong> <span>${lineData.test || 'N/A'}</span></p>
            <p><strong>Box:</strong> <span>${lineData.box || 'N/A'}</span></p>
            <p><strong>Terminal:</strong> <span>${lineData.terminal || 'N/A'}</span></p>
            <p><strong>Phone Number:</strong> <span>${lineData.phoneNumber || 'N/A'}</span></p>
            <p><strong>Second Phone Number:</strong> <span>${lineData.secondPhoneNumber || 'N/A'}</span></p>
            <p><strong>Address:</strong> <span>${lineData.address || 'N/A'}</span></p>
            <p><strong>Installation Date:</strong> <span>${installDate}</span></p>
            <p><strong>Length:</strong> <span>${lineData.length || 'N/A'}</span></p>
        </div>
    `;
}

// Toggle edit mode for line data
function toggleEditMode() {
    const editForm = document.getElementById('edit-form');
    const searchResults = document.getElementById('search-results');
    
    if (editForm.classList.contains('hidden')) {
        // Show edit form and populate with current data
        editForm.classList.remove('hidden');
        searchResults.classList.add('hidden');
        
        // Populate form with current line data
        document.getElementById('edit-line-number').value = window.currentLineId;
        document.getElementById('edit-port').value = window.currentLineData.port || '';
        document.getElementById('edit-cabinet').value = window.currentLineData.cabinet || '';
        document.getElementById('edit-test').value = window.currentLineData.test || '';
        document.getElementById('edit-box').value = window.currentLineData.box || '';
        document.getElementById('edit-terminal').value = window.currentLineData.terminal || '';
        document.getElementById('edit-phone').value = window.currentLineData.phoneNumber || '';
        document.getElementById('edit-second-phone').value = window.currentLineData.secondPhoneNumber || '';
        document.getElementById('edit-address').value = window.currentLineData.address || '';
        document.getElementById('edit-date').value = window.currentLineData.installationDate || '';
        document.getElementById('edit-length').value = window.currentLineData.length || '';
    } else {
        // Hide edit form, show results
        editForm.classList.add('hidden');
        searchResults.classList.remove('hidden');
    }
}

// Save edited line data
async function saveEditedLine() {
    const lineNumber = document.getElementById('edit-line-number').value;
    
    try {
        // Gather form data
        const lineData = {
            lineNumber: lineNumber,
            port: document.getElementById('edit-port').value,
            cabinet: document.getElementById('edit-cabinet').value,
            test: document.getElementById('edit-test').value,
            box: document.getElementById('edit-box').value,
            terminal: document.getElementById('edit-terminal').value,
            phoneNumber: document.getElementById('edit-phone').value,
            secondPhoneNumber: document.getElementById('edit-second-phone').value,
            address: document.getElementById('edit-address').value,
            installationDate: document.getElementById('edit-date').value,
            length: document.getElementById('edit-length').value,
            updatedAt: new Date().toISOString()
        };
        
        // Update in Firestore
        await linesCollection.doc(lineNumber).update(lineData);
        
        // Update current data
        window.currentLineData = lineData;
        
        // Refresh the display
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = createLineCard(lineData);
        
        // Hide edit form
        document.getElementById('edit-form').classList.add('hidden');
        document.getElementById('search-results').classList.remove('hidden');
        
        alert('Line data updated successfully');
    } catch (error) {
        console.error("Error updating line:", error);
        alert(`Error updating line: ${error.message}`);
    }
}

// Add new line
async function addNewLine() {
    const lineNumber = document.getElementById('add-line-number').value.trim();
    if (!lineNumber) {
        alert('Line number is required');
        return;
    }
    
    try {
        // Check if line already exists
        const existingLine = await linesCollection.doc(lineNumber).get();
        if (existingLine.exists) {
            alert('A line with this number already exists');
            return;
        }
        
        // Gather form data
        const lineData = {
            lineNumber: lineNumber,
            port: document.getElementById('add-port').value,
            cabinet: document.getElementById('add-cabinet').value,
            test: document.getElementById('add-test').value,
            box: document.getElementById('add-box').value,
            terminal: document.getElementById('add-terminal').value,
            phoneNumber: document.getElementById('add-phone').value,
            secondPhoneNumber: document.getElementById('add-second-phone').value,
            address: document.getElementById('add-address').value,
            installationDate: document.getElementById('add-date').value,
            length: document.getElementById('add-length').value,
            createdAt: new Date().toISOString()
        };
        
        // Add to Firestore
        await linesCollection.doc(lineNumber).set(lineData);
        
        // Reset form
        document.getElementById('add-line-form').reset();
        
        alert('New line added successfully');
    } catch (error) {
        console.error("Error adding new line:", error);
        alert(`Error adding new line: ${error.message}`);
    }
}

// Problem management functions
async function searchProblem() {
    const lineNumber = document.getElementById('problem-search-input').value.trim();
    if (!lineNumber) {
        alert('Please enter a line number');
        return;
    }
    
    const resultsContainer = document.getElementById('problem-search-results');
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        // First get the problem data
        const problemSnapshot = await problemsCollection.where('lineNumber', '==', lineNumber).get();
        
        if (problemSnapshot.empty) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No problems found for line: ${lineNumber}</p>
                </div>
            `;
            return;
        }
        
        // Get line data to display alongside problems
        let lineData = null;
        const lineDoc = await linesCollection.doc(lineNumber).get();
        if (lineDoc.exists) {
            lineData = lineDoc.data();
        }
        
        // Display problems
        let problemsHtml = '';
        problemSnapshot.forEach(doc => {
            const problemData = doc.data();
            window.currentProblemId = doc.id;
            window.currentProblemData = problemData;
            
            const isUnderground = problemData.undergroundCables ? 'underground' : '';
            
            problemsHtml += `
                <div class="problem-card ${isUnderground}">
                    <h3>Line #${problemData.lineNumber}</h3>
                    <p class="type">Type: ${problemData.type}</p>
                    <p><strong>Last Fixes:</strong> ${problemData.lastFixes || 'None'}</p>
                    <p><strong>Special Problems:</strong> ${problemData.specialProblems || 'None'}</p>
                    ${problemData.undergroundCables ? '<p class="underground-label"><strong>⚠️ Underground Cables</strong></p>' : ''}
                </div>
            `;
        });
        
        // If we have line data, add it
        if (lineData) {
            problemsHtml += `
                <div class="data-section">
                    <h3>Line Information</h3>
                    <div class="line-data">
                        <p><strong>Phone:</strong> ${lineData.phoneNumber || 'N/A'}</p>
                        <p><strong>Address:</strong> ${lineData.address || 'N/A'}</p>
                        <p><strong>Cabinet/Box:</strong> ${lineData.cabinet || 'N/A'} / ${lineData.box || 'N/A'}</p>
                    </div>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = problemsHtml;
    } catch (error) {
        console.error("Error searching for problems:", error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Toggle problem edit mode
function toggleProblemEditMode() {
    if (!window.currentProblemId) {
        alert('No problem selected for editing');
        return;
    }
    
    const editForm = document.getElementById('problem-edit-form');
    const searchResults = document.getElementById('problem-search-results');
    
    if (editForm.classList.contains('hidden')) {
        // Show edit form
        editForm.classList.remove('hidden');
        searchResults.classList.add('hidden');
        
        // Create edit form for problem
        editForm.innerHTML = `
            <form id="problem-edit-form-inner">
                <div class="form-group">
                    <label for="edit-problem-line">Line Number</label>
                    <input type="text" id="edit-problem-line" value="${window.currentProblemData.lineNumber}" readonly>
                </div>
                <div class="form-group">
                    <label for="edit-problem-type">Type</label>
                    <select id="edit-problem-type">
                        <option value="Voice" ${window.currentProblemData.type === 'Voice' ? 'selected' : ''}>Voice</option>
                        <option value="Voice&Data" ${window.currentProblemData.type === 'Voice&Data' ? 'selected' : ''}>Voice & Data</option>
                        <option value="DataOnly" ${window.currentProblemData.type === 'DataOnly' ? 'selected' : ''}>Data Only</option>
                        <option value="BLQ" ${window.currentProblemData.type === 'BLQ' ? 'selected' : ''}>BLQ</option>
                        <option value="Unstable" ${window.currentProblemData.type === 'Unstable' ? 'selected' : ''}>Unstable</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-problem-fixes">Last Fixes On The Line</label>
                    <textarea id="edit-problem-fixes">${window.currentProblemData.lastFixes || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-problem-special">Special Problems</label>
                    <textarea id="edit-problem-special">${window.currentProblemData.specialProblems || ''}</textarea>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="edit-problem-underground" ${window.currentProblemData.undergroundCables ? 'checked' : ''}>
                    <label for="edit-problem-underground">Underground Cables</label>
                </div>
                <button type="button" class="save-button" onclick="saveProblemEdit()">Save Changes</button>
                <button type="button" class="delete-button" onclick="deleteProblem()">Delete Problem</button>
            </form>
        `;
    } else {
        // Hide edit form
        editForm.classList.add('hidden');
        searchResults.classList.remove('hidden');
    }
}

// Save edited problem
async function saveProblemEdit() {
    try {
        // Gather form data
        const problemData = {
            lineNumber: document.getElementById('edit-problem-line').value,
            type: document.getElementById('edit-problem-type').value,
            lastFixes: document.getElementById('edit-problem-fixes').value,
            specialProblems: document.getElementById('edit-problem-special').value,
            undergroundCables: document.getElementById('edit-problem-underground').checked,
            updatedAt: new Date().toISOString()
        };
        
        // Update in Firestore
        await problemsCollection.doc(window.currentProblemId).update(problemData);
        
        // Update current data
        window.currentProblemData = problemData;
        
        // Hide edit form and search again to refresh
        document.getElementById('problem-edit-form').classList.add('hidden');
        document.getElementById('problem-search-results').classList.remove('hidden');
        
        // Refresh the problem display
        searchProblem();
        
        alert('Problem updated successfully');
    } catch (error) {
        console.error("Error updating problem:", error);
        alert(`Error updating problem: ${error.message}`);
    }
}

// Delete problem
async function deleteProblem() {
    if (confirm('Are you sure you want to delete this problem?')) {
        try {
            await problemsCollection.doc(window.currentProblemId).delete();
            
            // Hide edit form and reset problem search
            document.getElementById('problem-edit-form').classList.add('hidden');
            document.getElementById('problem-search-results').classList.remove('hidden');
            document.getElementById('problem-search-results').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Problem deleted successfully</p>
                </div>
            `;
            
            // Clear current problem data
            window.currentProblemId = null;
            window.currentProblemData = null;
        } catch (error) {
            console.error("Error deleting problem:", error);
            alert(`Error deleting problem: ${error.message}`);
        }
    }
}

// Add new problem
async function addProblem() {
    const lineNumber = document.getElementById('problem-line-number').value.trim();
    if (!lineNumber) {
        alert('Line number is required');
        return;
    }
    
    try {
        // Check if line exists
        const lineDoc = await linesCollection.doc(lineNumber).get();
        if (!lineDoc.exists) {
            if (!confirm('This line number does not exist in the database. Continue anyway?')) {
                return;
            }
        }
        
        // Gather form data
        const problemData = {
            lineNumber: lineNumber,
            type: document.getElementById('problem-type').value,
            lastFixes: document.getElementById('last-fixes').value,
            specialProblems: document.getElementById('special-problems').value,
            undergroundCables: document.getElementById('underground-cables').checked,
            createdAt: new Date().toISOString()
        };
        
        // Add to Firestore with auto-generated ID
        await problemsCollection.add(problemData);
        
        // Reset form
        document.getElementById('add-problem-form').reset();
        document.getElementById('problem-line-data').innerHTML = '<p>Search for a line to display data</p>';
        
        alert('Problem added successfully');
    } catch (error) {
        console.error("Error adding problem:", error);
        alert(`Error adding problem: ${error.message}`);
    }
}

// Fetch line data for problem form
async function fetchLineDataForProblem() {
    const lineNumber = document.getElementById('problem-line-number').value.trim();
    if (!lineNumber) return;
    
    try {
        const lineDoc = await linesCollection.doc(lineNumber).get();
        const lineDataDiv = document.getElementById('problem-line-data');
        
        if (lineDoc.exists) {
            const data = lineDoc.data();
            lineDataDiv.innerHTML = `
                <p><strong>Phone:</strong> ${data.phoneNumber || 'N/A'}</p>
                <p><strong>Address:</strong> ${data.address || 'N/A'}</p>
                <p><strong>Cabinet/Box:</strong> ${data.cabinet || 'N/A'} / ${data.box || 'N/A'}</p>
            `;
        } else {
            lineDataDiv.innerHTML = '<p>No line data found</p>';
        }
    } catch (error) {
        console.error("Error fetching line data:", error);
    }
}

// Event listener for line number input in problem form
document.addEventListener('DOMContentLoaded', function() {
    const problemLineInput = document.getElementById('problem-line-number');
    if (problemLineInput) {
        problemLineInput.addEventListener('blur', fetchLineDataForProblem);
    }
});

// Repair Wire functions
async function addRepair() {
    const lineNumber = document.getElementById('repair-line-number').value.trim();
    if (!lineNumber) {
        alert('Line number is required');
        return;
    }
    
    try {
        // Gather form data
        const repairData = {
            lineNumber: lineNumber,
            phoneNumber: document.getElementById('repair-phone').value,
            length: document.getElementById('repair-length').value,
            done: document.getElementById('repair-done').checked,
            date: document.getElementById('repair-date').value || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        
        // Add to Firestore with auto-generated ID
        await repairsCollection.add(repairData);
        
        // Reset form
        document.getElementById('repair-form').reset();
        
        // Refresh active repairs list
        loadActiveRepairs();
        
        alert('Repair added successfully');
    } catch (error) {
        console.error("Error adding repair:", error);
        alert(`Error adding repair: ${error.message}`);
    }
}

// Load active repairs (where done = false)
async function loadActiveRepairs() {
    const activeRepairsContainer = document.getElementById('active-repairs');
    activeRepairsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        const repairsSnapshot = await repairsCollection.where('done', '==', false).get();
        
        if (repairsSnapshot.empty) {
            activeRepairsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No active repairs</p>
                </div>
            `;
            return;
        }
        
        let repairsHtml = '';
        repairsSnapshot.forEach(doc => {
            const repairData = doc.data();
            const repairDate = repairData.date ? new Date(repairData.date).toLocaleDateString() : 'N/A';
            
            repairsHtml += `
                <div class="repair-card" data-id="${doc.id}">
                    <div class="repair-info">
                        <h3>Line #${repairData.lineNumber}</h3>
                        <p>${repairData.phoneNumber || 'No phone'} - ${repairData.length || 'No length'}</p>
                        <p class="repair-date">Added: ${repairDate}</p>
                    </div>
                    <div>
                        <span class="repair-status pending">Pending</span>
                        <button class="mark-done-button" onclick="markRepairAsDone('${doc.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        activeRepairsContainer.innerHTML = repairsHtml;
    } catch (error) {
        console.error("Error loading active repairs:", error);
        activeRepairsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Mark repair as done
async function markRepairAsDone(repairId) {
    try {
        await repairsCollection.doc(repairId).update({
            done: true,
            completedAt: new Date().toISOString()
        });
        
        // Refresh active repairs list
        loadActiveRepairs();
    } catch (error) {
        console.error("Error marking repair as done:", error);
        alert(`Error marking repair as done: ${error.message}`);
    }
}

// Search for repairs
async function searchRepair() {
    const searchTerm = document.getElementById('repair-search-input').value.trim();
    if (!searchTerm) {
        alert('Please enter a line number or phone number');
        return;
    }
    
    try {
        // Try to match by line number first
        let repairsSnapshot = await repairsCollection.where('lineNumber', '==', searchTerm).get();
        
        // If no results, try phone number
        if (repairsSnapshot.empty) {
            repairsSnapshot = await repairsCollection.where('phoneNumber', '==', searchTerm).get();
        }
        
        const activeRepairsContainer = document.getElementById('active-repairs');
        
        if (repairsSnapshot.empty) {
            activeRepairsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No repairs found for: ${searchTerm}</p>
                </div>
            `;
            return;
        }
        
        let repairsHtml = '';
        repairsSnapshot.forEach(doc => {
            const repairData = doc.data();
            const repairDate = repairData.date ? new Date(repairData.date).toLocaleDateString() : 'N/A';
            const statusClass = repairData.done ? 'completed' : 'pending';
            const statusText = repairData.done ? 'Completed' : 'Pending';
            
            repairsHtml += `
                <div class="repair-card" data-id="${doc.id}">
                    <div class="repair-info">
                        <h3>Line #${repairData.lineNumber}</h3>
                        <p>${repairData.phoneNumber || 'No phone'} - ${repairData.length || 'No length'}</p>
                        <p class="repair-date">Added: ${repairDate}</p>
                    </div>
                    <div>
                        <span class="repair-status ${statusClass}">${statusText}</span>
                        ${!repairData.done ? `
                            <button class="mark-done-button" onclick="markRepairAsDone('${doc.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        activeRepairsContainer.innerHTML = repairsHtml;
    } catch (error) {
        console.error("Error searching for repairs:", error);
        document.getElementById('active-repairs').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Initialize the app when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Initialize edit button visibility
    document.getElementById('edit-button').style.display = 'none';
    
    // Show main menu
    showScreen('main-menu');
});

// Database collections
const reviewsCollection = db.collection('reviews');

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Toggle reason field in review form
function toggleReasonField() {
    const status = document.getElementById('review-status').value;
    const reasonField = document.getElementById('reason-field');
    
    if (status === 'NotPossible') {
        reasonField.style.display = 'block';
    } else {
        reasonField.style.display = 'none';
    }
}

// Search for reviews
async function searchReview() {
    const phoneNumber = document.getElementById('review-search-input').value.trim();
    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }
    
    const resultsContainer = document.getElementById('review-search-results');
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        // Search by phone number
        const reviewSnapshot = await reviewsCollection.where('phoneNumber', '==', phoneNumber).orderBy('createdAt', 'desc').get();
        
        if (reviewSnapshot.empty) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No reviews found for phone number: ${phoneNumber}</p>
                </div>
            `;
            return;
        }
        
        // Display reviews
        let reviewsHtml = '';
        reviewSnapshot.forEach(doc => {
            const reviewData = doc.data();
            window.currentReviewId = doc.id;
            window.currentReviewData = reviewData;
            
            const statusClass = reviewData.status === 'NotPossible' ? 'not-possible' : '';
            
            reviewsHtml += `
                <div class="review-card ${statusClass}">
                    <h3>${reviewData.name || 'No Name'}</h3>
                    <p><strong>Phone:</strong> ${reviewData.phoneNumber}</p>
                    <p><strong>Box:</strong> ${reviewData.box || 'N/A'}</p>
                    <p><strong>Cabinet:</strong> ${reviewData.cabinet || 'N/A'}</p>
                    <p class="status ${statusClass}">Status: ${reviewData.status}</p>
                    ${reviewData.reason ? `<div class="reason"><strong>Reason:</strong> ${reviewData.reason}</div>` : ''}
                    <p class="review-date">Added: ${new Date(reviewData.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = reviewsHtml;
    } catch (error) {
        console.error("Error searching for reviews:", error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Toggle review edit mode
function toggleReviewEditMode() {
    if (!window.currentReviewId) {
        alert('No review selected for editing');
        return;
    }
    
    const editForm = document.getElementById('review-edit-form');
    const searchResults = document.getElementById('review-search-results');
    
    if (editForm.classList.contains('hidden')) {
        // Show edit form
        editForm.classList.remove('hidden');
        searchResults.classList.add('hidden');
        
        // Create edit form for review
        editForm.innerHTML = `
            <form id="review-edit-form-inner">
                <div class="form-group">
                    <label for="edit-review-phone">Phone Number</label>
                    <input type="text" id="edit-review-phone" value="${window.currentReviewData.phoneNumber}" required>
                </div>
                <div class="form-group">
                    <label for="edit-review-name">Name</label>
                    <input type="text" id="edit-review-name" value="${window.currentReviewData.name || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-review-box">Box</label>
                    <input type="text" id="edit-review-box" value="${window.currentReviewData.box || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-review-cabinet">Cabinet</label>
                    <input type="text" id="edit-review-cabinet" value="${window.currentReviewData.cabinet || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-review-status">Status</label>
                    <select id="edit-review-status" onchange="toggleEditReasonField()">
                        <option value="Possible" ${window.currentReviewData.status === 'Possible' ? 'selected' : ''}>Possible</option>
                        <option value="NotPossible" ${window.currentReviewData.status === 'NotPossible' ? 'selected' : ''}>Not Possible</option>
                    </select>
                </div>
                <div class="form-group" id="edit-reason-field" style="display: ${window.currentReviewData.status === 'NotPossible' ? 'block' : 'none'};">
                    <label for="edit-review-reason">Reason</label>
                    <textarea id="edit-review-reason">${window.currentReviewData.reason || ''}</textarea>
                </div>
                <button type="button" class="save-button" onclick="saveReviewEdit()">Save Changes</button>
                <button type="button" class="delete-button" onclick="deleteReview()">Delete Review</button>
            </form>
        `;
    } else {
        // Hide edit form
        editForm.classList.add('hidden');
        searchResults.classList.remove('hidden');
    }
}

// Toggle reason field in edit review form
function toggleEditReasonField() {
    const status = document.getElementById('edit-review-status').value;
    const reasonField = document.getElementById('edit-reason-field');
    
    if (status === 'NotPossible') {
        reasonField.style.display = 'block';
    } else {
        reasonField.style.display = 'none';
    }
}

// Save edited review
async function saveReviewEdit() {
    try {
        const status = document.getElementById('edit-review-status').value;
        
        // Gather form data
        const reviewData = {
            phoneNumber: document.getElementById('edit-review-phone').value,
            name: document.getElementById('edit-review-name').value,
            box: document.getElementById('edit-review-box').value,
            cabinet: document.getElementById('edit-review-cabinet').value,
            status: status,
            updatedAt: new Date().toISOString()
        };
        
        // Add reason field if NotPossible
        if (status === 'NotPossible') {
            reviewData.reason = document.getElementById('edit-review-reason').value;
        } else {
            reviewData.reason = '';
        }
        
        // Update in Firestore
        await reviewsCollection.doc(window.currentReviewId).update(reviewData);
        
        // Update current data
        window.currentReviewData = reviewData;
        
        // Hide edit form and search again to refresh
        document.getElementById('review-edit-form').classList.add('hidden');
        document.getElementById('review-search-results').classList.remove('hidden');
        
        // Refresh the review display
        searchReview();
        
        alert('Review updated successfully');
    } catch (error) {
        console.error("Error updating review:", error);
        alert(`Error updating review: ${error.message}`);
    }
}

// Delete review
async function deleteReview() {
    if (confirm('Are you sure you want to delete this review?')) {
        try {
            await reviewsCollection.doc(window.currentReviewId).delete();
            
            // Hide edit form and reset review search
            document.getElementById('review-edit-form').classList.add('hidden');
            document.getElementById('review-search-results').classList.remove('hidden');
            document.getElementById('review-search-results').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Review deleted successfully</p>
                </div>
            `;
            
            // Clear current review data
            window.currentReviewId = null;
            window.currentReviewData = null;
        } catch (error) {
            console.error("Error deleting review:", error);
            alert(`Error deleting review: ${error.message}`);
        }
    }
}

// Add new review
async function addReview() {
    const phoneNumber = document.getElementById('review-phone-number').value.trim();
    if (!phoneNumber) {
        alert('Phone number is required');
        return;
    }
    
    try {
        const status = document.getElementById('review-status').value;
        
        // Gather form data
        const reviewData = {
            phoneNumber: phoneNumber,
            name: document.getElementById('review-name').value,
            box: document.getElementById('review-box').value,
            cabinet: document.getElementById('review-cabinet').value,
            status: status,
            createdAt: new Date().toISOString()
        };
        
        // Add reason field if NotPossible
        if (status === 'NotPossible') {
            reviewData.reason = document.getElementById('review-reason').value;
        }
        
        // Add to Firestore with auto-generated ID
        await reviewsCollection.add(reviewData);
        
        // Reset form
        document.getElementById('add-review-form').reset();
        document.getElementById('reason-field').style.display = 'none';
        
        alert('Review added successfully');
    } catch (error) {
        console.error("Error adding review:", error);
        alert(`Error adding review: ${error.message}`);
    }
}

// Initialize the app when document is loaded - Add this to your existing initialization
document.addEventListener('DOMContentLoaded', function() {
    // Set up theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        }
    }
});
// Port Calculator Function
function calculatePort() {
    const portNumber = parseInt(document.getElementById('port-number-input').value);
    const resultContainer = document.getElementById('port-result');
    
    // Clear previous results
    resultContainer.innerHTML = '';
    
    // Validate input
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 1024) {
        resultContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Please enter a valid port number between 1 and 1024</p>
            </div>
        `;
        return;
    }
    
    // Calculate row and column
    const row = Math.ceil(portNumber / 16);
    const column = ((portNumber - 1) % 16) + 1;
    
    // Display results
    resultContainer.innerHTML = `
        <div class="line-card">
            <h3>Port ${portNumber} Position</h3>
            <p><strong>Row:</strong> <span>${row}</span></p>
            <p><strong>Column:</strong> <span>${column}</span></p>
        </div>
        <div class="calculation-details">
            <h4>Calculation Details:</h4>
            <p><strong>Row:</strong> Math.ceil(${portNumber} / 16) = ${row}</p>
            <p><strong>Column:</strong> ((${portNumber} - 1) % 16) + 1 = ${column}</p>
        </div>
    `;
}
// Screen navigation history tracking
let screenHistory = ['main-menu']; // Start with main menu

// Modified showScreen function with history tracking
function showScreen(screenId) {
    // Get the current active screen
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
        const currentScreenId = currentScreen.id;
        
        // Hide the current screen
        currentScreen.classList.remove('active');
        
        // If we're not just refreshing the same screen, add to history
        if (currentScreenId !== screenId) {
            // Only add to history if we're not going "back"
            // (which is determined in the goBack function)
            screenHistory.push(screenId);
        }
    }
    
    // Show the new screen
    const newScreen = document.getElementById(screenId);
    if (newScreen) {
        newScreen.classList.add('active');
    }
}

// New function for back button
function goBack() {
    // We always keep at least one item (main-menu) in history
    if (screenHistory.length > 1) {
        // Remove current screen from history
        screenHistory.pop();
        
        // Get the previous screen
        const previousScreen = screenHistory[screenHistory.length - 1];
        
        // Remove the previous screen from history temporarily
        // so showScreen won't add it again
        screenHistory.pop();
        
        // Show the previous screen
        showScreen(previousScreen);
    } else {
        // Fallback to main menu if no history
        showScreen('main-menu');
    }
}

// Replace all back button onclick handlers
document.addEventListener('DOMContentLoaded', function() {
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.setAttribute('onclick', 'goBack()');
    });
});

// First, let's add the checkbox to the problem form (this should go in your app.js)

// Function to add the finished checkbox to the problem form
function addFinishedCheckboxToProblemForm() {
    const specialProblemsField = document.getElementById('special-problems').parentElement;
    const finishedCheckboxHTML = `
      <div class="form-group checkbox-group">
        <input type="checkbox" id="problem-finished">
        <label for="problem-finished">Finished</label>
      </div>
    `;
    
    // Insert the new checkbox after the special problems field
    specialProblemsField.insertAdjacentHTML('afterend', finishedCheckboxHTML);
  }
  
  // Modified function to add a problem with finished status
  function addProblem() {
    const lineNumber = document.getElementById('problem-line-number').value.trim();
    if (!lineNumber) {
      alert('Please enter a line number');
      return;
    }
  
    const problemType = document.getElementById('problem-type').value;
    const lastFixes = document.getElementById('last-fixes').value;
    const specialProblems = document.getElementById('special-problems').value;
    const undergroundCables = document.getElementById('underground-cables').checked;
    const finished = document.getElementById('problem-finished').checked; // Get finished status
    
    const problemData = {
      lineNumber: lineNumber,
      type: problemType,
      lastFixes: lastFixes,
      specialProblems: specialProblems,
      undergroundCables: undergroundCables,
      finished: finished, // Add finished status to the problem data
      timestamp: new Date().toISOString()
    };
  
    // Save to database (assuming you're using Firebase)
    db.collection('problems').add(problemData)
      .then(() => {
        alert('Problem added successfully');
        document.getElementById('add-problem-form').reset();
        showScreen('problems-menu');
      })
      .catch(error => {
        console.error('Error adding problem: ', error);
        alert('Error adding problem: ' + error.message);
      });
  }
  
  // Modified function to load problems on the main problems screen
  // Only show unfinished problems
  function loadActiveProblems() {
    const problemsContainer = document.createElement('div');
  
    db.collection('problems')
      .where('finished', '==', false) // Only get unfinished problems
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          problemsContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <p>No active problems</p>
            </div>
          `;
        } else {
          snapshot.forEach(doc => {
            const problem = doc.data();
            problemsContainer.appendChild(createProblemCard(problem, doc.id));
          });
        }
        
        // Replace the problems list in the menu
        const problemsMenu = document.getElementById('problems-menu');
        const existingList = problemsMenu.querySelector('.problems-list');
        
        if (existingList) {
          existingList.remove();
        }
        
        problemsContainer.classList.add('problems-list');
        // Insert after the button grid
        problemsMenu.querySelector('.button-grid').after(problemsContainer);
      })
      .catch(error => {
        console.error('Error loading problems: ', error);
        problemsContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error loading problems</p>
          </div>
        `;
      });
  }
  
  // Modified search problem function to show both finished and unfinished problems
  function searchProblem() {
    const lineNumber = document.getElementById('problem-search-input').value.trim();
    const resultsContainer = document.getElementById('problem-search-results');
    
    if (!lineNumber) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Please enter a line number</p>
        </div>
      `;
      return;
    }
    
    // Show loading state
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Searching...</p>
      </div>
    `;
    
    db.collection('problems')
      .where('lineNumber', '==', lineNumber)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          resultsContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>No problems found for line ${lineNumber}</p>
            </div>
          `;
        } else {
          resultsContainer.innerHTML = '';
          snapshot.forEach(doc => {
            const problem = doc.data();
            resultsContainer.appendChild(createProblemCard(problem, doc.id, true));
          });
        }
      })
      .catch(error => {
        console.error('Error searching for problems: ', error);
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error searching for problems: ${error.message}</p>
          </div>
        `;
      });
  }
  
  // Modified function to create problem cards with finished status indicator
  function createProblemCard(problem, id, isSearchResult = false) {
    const card = document.createElement('div');
    card.className = `problem-card ${problem.undergroundCables ? 'underground' : ''}`;
    card.dataset.id = id;
    
    const finishedBadge = problem.finished ? 
      '<span class="finished-badge">Finished</span>' : '';
    
    card.innerHTML = `
      <span class="type">${problem.type}</span>
      <h3>Line: ${problem.lineNumber} ${finishedBadge}</h3>
      ${problem.lastFixes ? `<div class="problem-detail"><strong>Last Fixes:</strong> ${problem.lastFixes}</div>` : ''}
      ${problem.specialProblems ? `<div class="problem-detail"><strong>Special Problems:</strong> ${problem.specialProblems}</div>` : ''}
      <div class="problem-actions">
        ${isSearchResult ? `<button class="edit-problem-btn" onclick="editProblem('${id}')"><i class="fas fa-edit"></i></button>` : ''}
        <button class="toggle-finished-btn" onclick="toggleProblemFinished('${id}', ${!problem.finished})">
          <i class="fas ${problem.finished ? 'fa-check-circle' : 'fa-circle'}"></i>
          ${problem.finished ? 'Mark Unfinished' : 'Mark Finished'}
        </button>
      </div>
    `;
    
    return card;
  }
  
  // Function to toggle problem finished status
  function toggleProblemFinished(id, finished) {
    db.collection('problems').doc(id).update({
      finished: finished
    })
    .then(() => {
      alert(`Problem marked as ${finished ? 'finished' : 'unfinished'}`);
      
      // Refresh the current screen
      const activeScreen = document.querySelector('.screen.active');
      if (activeScreen.id === 'problems-menu') {
        loadActiveProblems();
      } else if (activeScreen.id === 'problems-search') {
        searchProblem();
      }
    })
    .catch(error => {
      console.error('Error updating problem: ', error);
      alert('Error updating problem: ' + error.message);
    });
  }
  
  // Modified function to edit a problem
  function editProblem(id) {
    const editForm = document.getElementById('problem-edit-form');
    editForm.innerHTML = ''; // Clear form
    
    db.collection('problems').doc(id).get()
      .then(doc => {
        if (!doc.exists) {
          alert('Problem not found');
          return;
        }
        
        const problem = doc.data();
        
        editForm.innerHTML = `
          <form>
            <div class="form-group">
              <label for="edit-problem-line">Line Number</label>
              <input type="text" id="edit-problem-line" value="${problem.lineNumber}" readonly>
            </div>
            <div class="form-group">
              <label for="edit-problem-type">Type</label>
              <select id="edit-problem-type">
                <option value="Voice" ${problem.type === 'Voice' ? 'selected' : ''}>Voice</option>
                <option value="Voice&Data" ${problem.type === 'Voice&Data' ? 'selected' : ''}>Voice & Data</option>
                <option value="DataOnly" ${problem.type === 'DataOnly' ? 'selected' : ''}>Data Only</option>
                <option value="BLQ" ${problem.type === 'BLQ' ? 'selected' : ''}>BLQ</option>
                <option value="Unstable" ${problem.type === 'Unstable' ? 'selected' : ''}>Unstable</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-last-fixes">Last Fixes On The Line</label>
              <textarea id="edit-last-fixes">${problem.lastFixes || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="edit-special-problems">Special Problems</label>
              <textarea id="edit-special-problems">${problem.specialProblems || ''}</textarea>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="edit-underground-cables" ${problem.undergroundCables ? 'checked' : ''}>
              <label for="edit-underground-cables">Underground Cables</label>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="edit-problem-finished" ${problem.finished ? 'checked' : ''}>
              <label for="edit-problem-finished">Finished</label>
            </div>
            <button type="button" class="save-button" onclick="saveEditedProblem('${id}')">Save Changes</button>
          </form>
        `;
        
        editForm.classList.remove('hidden');
      })
      .catch(error => {
        console.error('Error getting problem: ', error);
        alert('Error getting problem: ' + error.message);
      });
  }
  
  // Function to save edited problem
  function saveEditedProblem(id) {
    const type = document.getElementById('edit-problem-type').value;
    const lastFixes = document.getElementById('edit-last-fixes').value;
    const specialProblems = document.getElementById('edit-special-problems').value;
    const undergroundCables = document.getElementById('edit-underground-cables').checked;
    const finished = document.getElementById('edit-problem-finished').checked;
    
    db.collection('problems').doc(id).update({
      type: type,
      lastFixes: lastFixes,
      specialProblems: specialProblems,
      undergroundCables: undergroundCables,
      finished: finished
    })
    .then(() => {
      alert('Problem updated successfully');
      document.getElementById('problem-edit-form').classList.add('hidden');
      searchProblem(); // Refresh results
    })
    .catch(error => {
      console.error('Error updating problem: ', error);
      alert('Error updating problem: ' + error.message);
    });
  }
  
  // Add this to the initialization code or DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', function() {
    // Add the finished checkbox to the problem form
    addFinishedCheckboxToProblemForm();
    
    // Load active problems when showing the problems menu
    const problemsMenuBtn = document.querySelector('button[onclick="showScreen(\'problems-menu\')"]');
    if (problemsMenuBtn) {
      const originalOnclick = problemsMenuBtn.onclick;
      problemsMenuBtn.onclick = function() {
        originalOnclick.apply(this);
        loadActiveProblems();
      };
    }
  });

  // Load active reviews (non-finished) for the reviews menu
function loadActiveReviews() {
    const activeReviewsContainer = document.getElementById('active-reviews');
    
    // Clear the container
    activeReviewsContainer.innerHTML = '';
    
    // Show loading state
    activeReviewsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading active reviews...</p>
        </div>
    `;
    
    // Get all reviews that are not marked as finished
    const reviewsRef = firebase.firestore().collection('reviews');
    reviewsRef.where('finished', '!=', true).get()
        .then((querySnapshot) => {
            activeReviewsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                activeReviewsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-star"></i>
                        <p>No active reviews</p>
                    </div>
                `;
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const review = doc.data();
                const reviewCard = document.createElement('div');
                reviewCard.className = `review-card ${review.status === 'NotPossible' ? 'not-possible' : ''}`;
                
                let reasonHtml = '';
                if (review.status === 'NotPossible' && review.reason) {
                    reasonHtml = `
                        <div class="reason">
                            <strong>Reason:</strong> ${review.reason}
                        </div>
                    `;
                }
                
                reviewCard.innerHTML = `
                    <div class="status ${review.status === 'NotPossible' ? 'not-possible' : ''}">
                        ${review.status === 'Possible' ? 'Possible' : 'Not Possible'}
                    </div>
                    <h3>${review.phoneNumber}</h3>
                    <p><strong>Name:</strong> ${review.name || 'N/A'}</p>
                    <p><strong>Box:</strong> ${review.box || 'N/A'}</p>
                    <p><strong>Cabinet:</strong> ${review.cabinet || 'N/A'}</p>
                    ${reasonHtml}
                    <div class="problem-actions">
                        <button class="toggle-finished-btn" onclick="toggleReviewFinished('${doc.id}', true)">
                            <i class="far fa-circle"></i> Mark as Finished
                        </button>
                    </div>
                `;
                
                activeReviewsContainer.appendChild(reviewCard);
            });
        })
        .catch((error) => {
            console.error("Error loading active reviews: ", error);
            activeReviewsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading reviews. Please try again.</p>
                </div>
            `;
        });
}

// Function to toggle a review's finished status
function toggleReviewFinished(reviewId, finished) {
    firebase.firestore().collection('reviews').doc(reviewId).update({
        finished: finished
    })
    .then(() => {
        showNotification(finished ? 'Review marked as finished' : 'Review marked as active');
        // Reload the active reviews list
        loadActiveReviews();
    })
    .catch((error) => {
        console.error("Error updating review: ", error);
        showNotification('Error updating review', 'error');
    });
}

// Modify the addReview function to include the finished status
function addReview() {
    const phoneNumber = document.getElementById('review-phone-number').value.trim();
    if (!phoneNumber) {
        showNotification('Phone number is required', 'error');
        return;
    }
    
    const review = {
        phoneNumber: phoneNumber,
        name: document.getElementById('review-name').value.trim(),
        box: document.getElementById('review-box').value.trim(),
        cabinet: document.getElementById('review-cabinet').value.trim(),
        status: document.getElementById('review-status').value,
        reason: document.getElementById('review-reason').value.trim(),
        finished: document.getElementById('review-finished').checked,
        createdAt: new Date()
    };
    
    firebase.firestore().collection('reviews').add(review)
        .then(() => {
            document.getElementById('add-review-form').reset();
            showNotification('Review added successfully');
            // Go back to review menu
            showScreen('review-menu');
            // Reload active reviews
            loadActiveReviews();
        })
        .catch((error) => {
            console.error("Error adding review: ", error);
            showNotification('Error adding review', 'error');
        });
}

// Modify the searchReview function to show all reviews regardless of finished status
function searchReview() {
    const searchInput = document.getElementById('review-search-input').value.trim();
    const resultsContainer = document.getElementById('review-search-results');
    
    if (!searchInput) {
        showNotification('Please enter a phone number to search', 'error');
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching...</p>
        </div>
    `;
    
    firebase.firestore().collection('reviews')
        .where('phoneNumber', '==', searchInput)
        .get()
        .then((querySnapshot) => {
            resultsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>No reviews found for this phone number</p>
                    </div>
                `;
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const review = doc.data();
                const reviewCard = document.createElement('div');
                reviewCard.className = `review-card ${review.status === 'NotPossible' ? 'not-possible' : ''}`;
                reviewCard.setAttribute('data-id', doc.id);
                
                let reasonHtml = '';
                if (review.status === 'NotPossible' && review.reason) {
                    reasonHtml = `
                        <div class="reason">
                            <strong>Reason:</strong> ${review.reason}
                        </div>
                    `;
                }
                
                let finishedBadge = '';
                if (review.finished) {
                    finishedBadge = '<span class="finished-badge">Finished</span>';
                }
                
                reviewCard.innerHTML = `
                    <div class="status ${review.status === 'NotPossible' ? 'not-possible' : ''}">
                        ${review.status === 'Possible' ? 'Possible' : 'Not Possible'} ${finishedBadge}
                    </div>
                    <h3>${review.phoneNumber}</h3>
                    <p><strong>Name:</strong> ${review.name || 'N/A'}</p>
                    <p><strong>Box:</strong> ${review.box || 'N/A'}</p>
                    <p><strong>Cabinet:</strong> ${review.cabinet || 'N/A'}</p>
                    ${reasonHtml}
                    <div class="problem-actions">
                        <button class="edit-item-btn" onclick="editReview('${doc.id}')">
                            <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="toggle-finished-btn" onclick="toggleReviewFinished('${doc.id}', ${!review.finished})">
                            <i class="${review.finished ? 'fas fa-check-circle' : 'far fa-circle'}"></i> 
                            ${review.finished ? 'Mark as Active' : 'Mark as Finished'}
                        </button>
                    </div>
                `;
                
                resultsContainer.appendChild(reviewCard);
            });
        })
        .catch((error) => {
            console.error("Error searching reviews: ", error);
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error searching reviews. Please try again.</p>
                </div>
            `;
        });
}

// Function to edit a review
function editReview(reviewId) {
    const editForm = document.getElementById('review-edit-form');
    editForm.classList.remove('hidden');
    
    firebase.firestore().collection('reviews').doc(reviewId).get()
        .then((doc) => {
            if (doc.exists) {
                const review = doc.data();
                
                // Create the edit form
                editForm.innerHTML = `
                    <form id="edit-review-form">
                        <div class="form-group">
                            <label for="edit-review-phone">Phone Number</label>
                            <input type="text" id="edit-review-phone" value="${review.phoneNumber || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-review-name">Name</label>
                            <input type="text" id="edit-review-name" value="${review.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-review-box">Box</label>
                            <input type="text" id="edit-review-box" value="${review.box || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-review-cabinet">Cabinet</label>
                            <input type="text" id="edit-review-cabinet" value="${review.cabinet || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-review-status">Status</label>
                            <select id="edit-review-status" onchange="toggleEditReasonField()">
                                <option value="Possible" ${review.status === 'Possible' ? 'selected' : ''}>Possible</option>
                                <option value="NotPossible" ${review.status === 'NotPossible' ? 'selected' : ''}>Not Possible</option>
                            </select>
                        </div>
                        <div class="form-group" id="edit-reason-field" style="${review.status === 'NotPossible' ? '' : 'display: none;'}">
                            <label for="edit-review-reason">Reason</label>
                            <textarea id="edit-review-reason">${review.reason || ''}</textarea>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="edit-review-finished" ${review.finished ? 'checked' : ''}>
                            <label for="edit-review-finished">Finished</label>
                        </div>
                        <button type="button" class="save-button" onclick="saveEditedReview('${reviewId}')">Save Changes</button>
                        <button type="button" class="cancel-button" onclick="cancelEditReview()">Cancel</button>
                    </form>
                `;
            } else {
                showNotification('Review not found', 'error');
                editForm.classList.add('hidden');
            }
        })
        .catch((error) => {
            console.error("Error getting review: ", error);
            showNotification('Error loading review data', 'error');
            editForm.classList.add('hidden');
        });
}

// Function to toggle the reason field in edit form based on status selection
function toggleEditReasonField() {
    const status = document.getElementById('edit-review-status').value;
    const reasonField = document.getElementById('edit-reason-field');
    
    if (status === 'NotPossible') {
        reasonField.style.display = '';
    } else {
        reasonField.style.display = 'none';
    }
}

// Function to save the edited review
function saveEditedReview(reviewId) {
    const updatedReview = {
        phoneNumber: document.getElementById('edit-review-phone').value.trim(),
        name: document.getElementById('edit-review-name').value.trim(),
        box: document.getElementById('edit-review-box').value.trim(),
        cabinet: document.getElementById('edit-review-cabinet').value.trim(),
        status: document.getElementById('edit-review-status').value,
        reason: document.getElementById('edit-review-reason').value.trim(),
        finished: document.getElementById('edit-review-finished').checked,
        updatedAt: new Date()
    };
    
    firebase.firestore().collection('reviews').doc(reviewId).update(updatedReview)
        .then(() => {
            document.getElementById('review-edit-form').classList.add('hidden');
            showNotification('Review updated successfully');
            // Refresh search results
            searchReview();
        })
        .catch((error) => {
            console.error("Error updating review: ", error);
            showNotification('Error updating review', 'error');
        });
}

// Function to cancel review editing
function cancelEditReview() {
    document.getElementById('review-edit-form').classList.add('hidden');
}

// Add event listener for the review-menu screen to load active reviews
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for screen changes
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.addEventListener('screenActivated', function(e) {
            if (e.target.id === 'review-menu') {
                loadActiveReviews();
            }
        });
    });
});

// Helper function to dispatch a custom event when showing a screen
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the selected screen
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    
    // Dispatch custom event
    const event = new Event('screenActivated');
    targetScreen.dispatchEvent(event);
}





// Function to show all pending repairs
function showPendingRepairs() {
    // Get all repairs from local storage
    const repairs = JSON.parse(localStorage.getItem('repairs')) || [];
    
    // Filter for repairs that are not marked as done
    const pendingRepairs = repairs.filter(repair => !repair.done);
    
    const activeRepairsContainer = document.getElementById('active-repairs');
    
    // Clear current content
    activeRepairsContainer.innerHTML = '';
    
    if (pendingRepairs.length === 0) {
        // Show empty state if no pending repairs
        activeRepairsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No pending repairs found</p>
            </div>
        `;
        return;
    }
    
    // Add each pending repair to the container
    pendingRepairs.forEach(repair => {
        const repairCard = document.createElement('div');
        repairCard.className = 'pending-repair-card';
        
        const formattedDate = repair.date ? new Date(repair.date).toLocaleDateString() : 'No date';
        
        repairCard.innerHTML = `
            <h3>Line: ${repair.lineNumber} <span class="pending-badge">PENDING</span></h3>
            <div class="repair-details">
                <p><strong>Phone:</strong> ${repair.phone || 'N/A'}</p>
                <p><strong>Length:</strong> ${repair.length || 'N/A'}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
            </div>
            <div class="repair-actions">
                <button class="mark-done-btn" onclick="markRepairAsDone('${repair.lineNumber}')">
                    <i class="fas fa-check"></i> Mark as Done
                </button>
            </div>
        `;
        
        activeRepairsContainer.appendChild(repairCard);
    });
}

// Function to mark a repair as done
function markRepairAsDone(lineNumber) {
    // Get all repairs
    const repairs = JSON.parse(localStorage.getItem('repairs')) || [];
    
    // Find the repair with matching line number
    const repairIndex = repairs.findIndex(repair => repair.lineNumber === lineNumber);
    
    if (repairIndex !== -1) {
        // Update the repair to mark it as done
        repairs[repairIndex].done = true;
        
        // Save back to localStorage
        localStorage.setItem('repairs', JSON.stringify(repairs));
        
        // Refresh the display
        showPendingRepairs();
        
        // Show success message
        showToast('Repair marked as completed!');
    }
}

// Helper function to show toast notification
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add this to your existing event listeners or initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker to today's date for new repairs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('repair-date').value = today;
    
    // Add this to load repairs when the repair screen is shown
    const originalShowScreen = window.showScreen || function() {};
    
    window.showScreen = function(screenId) {
        originalShowScreen(screenId);
        
        // If showing repair screen, initialize with empty state
        if (screenId === 'repair-screen') {
            const activeRepairsContainer = document.getElementById('active-repairs');
            activeRepairsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <p>Click "Show Pending Repairs" to view all pending tasks</p>
                </div>
            `;
        }
    };
});

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

// Global Variables
let currentProblemId = null;
let currentRepairId = null;
let currentReviewId = null;
let currentLineId = null;

// Theme Management
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// Navigation Functions
function showMainMenu() {
    document.getElementById('main-menu').classList.add('active');
    document.querySelector('.screen-container').classList.remove('active');
}

function showScreen(screenId) {
    document.getElementById('main-menu').classList.remove('active');
    const screenContainer = document.querySelector('.screen-container');
    screenContainer.classList.add('active');
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Show the requested screen
    document.getElementById(screenId).style.display = 'block';
    
    // Load data if needed
    if (screenId === 'problems') loadProblems();
    if (screenId === 'repair') loadRepairs();
    if (screenId === 'review') loadReviews();
}

function showAddLineScreen() {
    showScreen('addLine');
}

// Modal Functions
function showModal(modalType, id = null) {
    const template = document.getElementById(`${modalType}Template`);
    const clone = template.content.cloneNode(true);
    document.getElementById('modalContent').innerHTML = '';
    document.getElementById('modalContent').appendChild(clone);
    
    // Set edit mode if ID is provided
    if (id) {
        if (modalType === 'problemForm') editProblem(id);
        if (modalType === 'repairForm') editRepair(id);
        if (modalType === 'reviewForm') editReview(id);
    }
    
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    currentProblemId = null;
    currentRepairId = null;
    currentReviewId = null;
    currentLineId = null;
}

// Notification Function
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    document.getElementById('notificationContainer').appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// View Problem Function
async function viewProblem(id) {
    try {
        // Get problem data
        const problemDoc = await db.collection('problems').doc(id).get();
        if (!problemDoc.exists) {
            throw new Error('Problem not found');
        }
        
        const problem = problemDoc.data();
        
        // Get line data if line number exists
        let lineData = null;
        if (problem.lineNumber) {
            const lineQuery = await db.collection('lines')
                .where('lineNumber', '==', problem.lineNumber)
                .get();
                
            if (!lineQuery.empty) {
                lineData = lineQuery.docs[0].data();
            }
        }
        
        // Show modal with template
        const template = document.getElementById('viewProblemTemplate');
        const clone = template.content.cloneNode(true);
        document.getElementById('modalContent').innerHTML = '';
        document.getElementById('modalContent').appendChild(clone);
        
        // Fill problem details
        const problemDetails = document.getElementById('problemDetails');
        problemDetails.innerHTML = `
            <h3>Problem Information</h3>
            <p><strong>Line Number:</strong> ${problem.lineNumber || 'N/A'}</p>
            <p><strong>Type:</strong> ${problem.type || 'N/A'}</p>
            <p><strong>Status:</strong> ${problem.finished ? '✅ Finished' : '⚠️ Active'}</p>
            <p><strong>Last Fixes:</strong> ${problem.pFixes || 'None recorded'}</p>
            <p><strong>Special Problems:</strong> ${problem.pSpecial || 'None'}</p>
            <p><strong>Underground Cables:</strong> ${problem.pUnderground ? 'Yes' : 'No'}</p>
            <p class="timestamp">Reported: ${problem.createdAt?.toDate().toLocaleString()}</p>
            ${problem.updatedAt ? `<p class="timestamp">Last Updated: ${problem.updatedAt?.toDate().toLocaleString()}</p>` : ''}
        `;
        
        // Fill line details if available
        const lineDetails = document.getElementById('lineDetails');
        if (lineData) {
            lineDetails.innerHTML = `
                <h3>Line Information</h3>
                <p><strong>Customer Name:</strong> ${lineData.customerName || 'N/A'}</p>
                <p><strong>Port:</strong> ${lineData.port || 'N/A'}</p>
                <p><strong>Test:</strong> ${lineData.test || 'N/A'}</p>
                <p><strong>Cabinet:</strong> ${lineData.cabinet || 'N/A'}</p>
                <p><strong>Box:</strong> ${lineData.box || 'N/A'}</p>
                <p><strong>Terminal:</strong> ${lineData.terminal || 'N/A'}</p>
                <p><strong>Phone:</strong> ${lineData.phoneNumber || 'N/A'}</p>
                <p><strong>SecondPhoneNumber:</strong> ${lineData.secondPhoneNumber || 'N/A'}</p>
                <p><strong>Address:</strong> ${lineData.address || 'N/A'}</p>
                <p class="timestamp">Created: ${lineData.createdAt?.toDate().toLocaleString()}</p>
            `;
        } else {
            lineDetails.innerHTML = '<p>No line information found in database</p>';
        }
        
        document.getElementById('modalOverlay').style.display = 'flex';
        
    } catch (error) {
        showNotification('Error viewing problem: ' + error.message, true);
    }
}

// Search Line Function
async function searchLine() {
    const lineNumber = document.getElementById('searchLine').value;
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

    if (!lineNumber) {
        showNotification('Please enter a line number', true);
        resultsDiv.innerHTML = '';
        return;
    }

    try {
        const lineNum = parseInt(lineNumber);
        
        // Search all collections in parallel
        const [linesSnapshot, problemsSnapshot, repairsSnapshot] = await Promise.all([
            db.collection('lines').where('lineNumber', '==', lineNum).get(),
            db.collection('problems').where('lineNumber', '==', lineNum).get(),
            db.collection('repairs').where('rLineNumber', '==', lineNum).get()
        ]);

        resultsDiv.innerHTML = '';

        if (linesSnapshot.empty && problemsSnapshot.empty && repairsSnapshot.empty) {
            resultsDiv.innerHTML = '<p class="no-results">No results found for line ' + lineNum + '</p>';
            return;
        }

        // Display line information if found
        if (!linesSnapshot.empty) {
            linesSnapshot.forEach(doc => {
                const line = doc.data();
                resultsDiv.innerHTML += `
                    <div class="card">
                        <div class="list-item-header">
                            <h3>Line Information</h3>
                            <div class="list-item-actions">
                                <button class="edit-btn" onclick="editLine('${doc.id}')">✏️</button>
                                <button class="delete-btn" onclick="deleteLine('${doc.id}')">🗑️</button>
                            </div>
                        </div>
                        <p><strong>Customer:</strong> ${line.customerName || 'N/A'}</p>
                        <p><strong>Line Number:</strong> ${line.lineNumber || 'N/A'}</p>
                        <p><strong>Port:</strong> ${line.port || 'N/A'}</p>
                        <p><strong>Test:</strong> ${line.test || 'N/A'}</p>
                        <p><strong>Cabinet:</strong> ${line.cabinet || 'N/A'}</p>
                        <p><strong>Box:</strong> ${line.box || 'N/A'}</p>
                        <p><strong>Terminal:</strong> ${line.terminal || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${line.phoneNumber || 'N/A'}</p>
                        <p><strong>Second Phone Number:</strong> ${line.secondPhoneNumber || 'N/A'}</p>
                        <p><strong>Address:</strong> ${line.address || 'N/A'}</p>
                        <p><strong>Installation Date:</strong> ${line.installationDate || 'N/A'}</p>
                        <p><strong>Length:</strong> ${line.length || 'N/A'}</p>
                        <p class="timestamp">Created: ${line.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                `;
            });
        }

        // Display problems if found
        if (!problemsSnapshot.empty) {
            resultsDiv.innerHTML += `<h3 class="results-section-header">Problems</h3>`;
            problemsSnapshot.forEach(doc => {
                const problem = doc.data();
                resultsDiv.innerHTML += `
                    <div class="list-item ${problem.finished ? 'finished' : ''} ${problem.pUnderground ? 'underground' : ''}">
                        <div class="list-item-header">
                            <h4>${problem.type || 'Problem Report'}</h4>
                            <div class="list-item-actions">
                                <button class="view-btn" onclick="viewProblem('${doc.id}')">👁️</button>
                                <button class="edit-btn" onclick="showProblemForm('${doc.id}')">✏️</button>
                                <button class="delete-btn" onclick="deleteProblem('${doc.id}')">🗑️</button>
                            </div>
                        </div>
                        <p><strong>Status:</strong> ${problem.finished ? '✅ Finished' : '⚠️ Active'}</p>
                        <p><strong>Details:</strong> ${problem.pFixes || 'No details'}</p>
                        <p class="timestamp">Reported: ${problem.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                `;
            });
        }

        // Display repairs if found
        if (!repairsSnapshot.empty) {
            resultsDiv.innerHTML += `<h3 class="results-section-header">Repairs</h3>`;
            repairsSnapshot.forEach(doc => {
                const repair = doc.data();
                resultsDiv.innerHTML += `
                    <div class="list-item ${repair.rFinished ? 'finished' : ''}">
                        <div class="list-item-header">
                            <h4>Repair Record</h4>
                            <div class="list-item-actions">
                                <button class="edit-btn" onclick="showRepairForm('${doc.id}')">✏️</button>
                                <button class="delete-btn" onclick="deleteRepair('${doc.id}')">🗑️</button>
                            </div>
                        </div>
                        <p><strong>Date:</strong> ${repair.rDate || 'N/A'}</p>
                        <p><strong>Length:</strong> ${repair.rLength || 'N/A'}m</p>
                        <p><strong>Status:</strong> ${repair.rFinished ? '✅ Finished' : '⚠️ Active'}</p>
                        <p class="timestamp">Reported: ${repair.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                `;
            });
        }

    } catch (error) {
        showNotification('Search failed: ' + error.message, true);
        resultsDiv.innerHTML = '';
    }
}

// Line Functions
async function editLine(id) {
    try {
        const doc = await db.collection('lines').doc(id).get();
        if (!doc.exists) {
            throw new Error('Line not found');
        }
        
        const line = doc.data();
        // Fill the add line form with existing data
        showAddLineScreen();
        document.getElementById('lineNumber').value = line.lineNumber || '';
        document.getElementById('port').value = line.port || '';
        document.getElementById('cabinet').value = line.cabinet || '';
        document.getElementById('test').value = line.test || '';
        document.getElementById('box').value = line.box || '';
        document.getElementById('terminal').value = line.terminal || '';
        document.getElementById('phoneNumber').value = line.phoneNumber || '';
        document.getElementById('secondPhoneNumber').value = line.secondPhoneNumber || '';
        document.getElementById('address').value = line.address || '';
        document.getElementById('installationDate').value = line.installationDate || '';
        document.getElementById('length').value = line.length || '';
        
        // Store the ID for updating
        currentLineId = id;
        
    } catch (error) {
        showNotification('Error editing line: ' + error.message, true);
    }
}

async function deleteLine(id) {
    if (confirm('Are you sure you want to delete this line record?')) {
        try {
            await db.collection('lines').doc(id).delete();
            showNotification('Line deleted successfully!');
            searchLine(); // Refresh the search results
        } catch (error) {
            showNotification('Error deleting line: ' + error.message, true);
        }
    }
}

async function saveLine() {
    const lineData = {
        customerName: document.getElementById('lineName').value,
        lineNumber: parseInt(document.getElementById('lineNumber').value),
        port: document.getElementById('port').value,
        cabinet: document.getElementById('cabinet').value,
        test: document.getElementById('test').value,
        box: document.getElementById('box').value,
        terminal: document.getElementById('terminal').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        secondPhoneNumber: document.getElementById('secondPhoneNumber').value,
        address: document.getElementById('address').value,
        installationDate: document.getElementById('installationDate').value,
        length: document.getElementById('length').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentLineId) {
            // Update existing line
            await db.collection('lines').doc(currentLineId).update(lineData);
            showNotification('Line updated successfully!');
        } else {
            // Add new line
            lineData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('lines').add(lineData);
            showNotification('Line added successfully!');
        }
        
        showScreen('search');
        currentLineId = null;
    } catch (error) {
        showNotification('Error saving line: ' + error.message, true);
    }
}

// Problem Functions
function showProblemForm(id = null) {
    showModal('problemForm', id);
}

async function loadProblems() {
    try {
        const snapshot = await db.collection('problems')
            .where('finished', '==', false)
            .get();
            
        const listDiv = document.getElementById('problemsList');
        listDiv.innerHTML = '';

        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="no-results">No active problems found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const problem = doc.data();
            listDiv.innerHTML += `
                <div class="list-item ${problem.pUnderground ? 'underground' : ''}">
                    <div class="list-item-header">
                        <h3>Line ${problem.lineNumber} - ${problem.type}</h3>
                        <div class="list-item-actions">
                            <button class="view-btn" onclick="viewProblem('${doc.id}')">👁️</button>
                            <button class="edit-btn" onclick="showProblemForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteProblem('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Last Fixes:</strong> ${problem.pFixes || 'None recorded'}</p>
                    <p><strong>Special Problems:</strong> ${problem.pSpecial || 'None'}</p>
                    ${problem.pUnderground ? '<p class="warning">⚠️ Underground Cables</p>' : ''}
                    <p class="timestamp">Reported: ${problem.createdAt?.toDate().toLocaleString()}</p>
                </div>
            `;
        });
    } catch (error) {
        showNotification('Error loading problems: ' + error.message, true);
    }
}

async function searchProblem() {
    const lineNumber = document.getElementById('searchProblem').value;
    const resultsDiv = document.getElementById('problemSearchResults');
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

    try {
        let query = db.collection('problems');
        if (lineNumber) {
            query = query.where('lineNumber', '==', parseInt(lineNumber));
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        resultsDiv.innerHTML = '';

        if (snapshot.empty) {
            resultsDiv.innerHTML = '<p class="no-results">No problems found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const problem = doc.data();
            resultsDiv.innerHTML += `
                <div class="list-item ${problem.finished ? 'finished' : ''} ${problem.pUnderground ? 'underground' : ''}">
                    <div class="list-item-header">
                        <h3>Line ${problem.lineNumber} - ${problem.type}</h3>
                        <div class="list-item-actions">
                            <button class="view-btn" onclick="viewProblem('${doc.id}')">👁️</button>
                            <button class="edit-btn" onclick="showProblemForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteProblem('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Status:</strong> ${problem.finished ? '✅ Finished' : '⚠️ Active'}</p>
                    <p><strong>Last Fixes:</strong> ${problem.pFixes || 'None recorded'}</p>
                    <p><strong>Special Problems:</strong> ${problem.pSpecial || 'None'}</p>
                    ${problem.pUnderground ? '<p class="warning">⚠️ Underground Cables</p>' : ''}
                    <p class="timestamp">Reported: ${problem.createdAt?.toDate().toLocaleString()}</p>
                    ${problem.updatedAt ? `<p class="timestamp">Last Updated: ${problem.updatedAt?.toDate().toLocaleString()}</p>` : ''}
                </div>
            `;
        });
    } catch (error) {
        showNotification('Search failed: ' + error.message, true);
    }
}

async function editProblem(id) {
    try {
        currentProblemId = id;
        document.getElementById('problemFormTitle').textContent = 'Edit Problem Report';
        
        const doc = await db.collection('problems').doc(id).get();
        if (!doc.exists) {
            throw new Error('Problem not found');
        }
        
        const data = doc.data();
        document.getElementById('pLineNumber').value = data.lineNumber;
        document.getElementById('pType').value = data.type;
        document.getElementById('pFixes').value = data.pFixes || '';
        document.getElementById('pSpecial').value = data.pSpecial || '';
        document.getElementById('pUnderground').checked = data.pUnderground || false;
        document.getElementById('pFinished').checked = data.finished || false;
        
    } catch (error) {
        showNotification('Error editing problem: ' + error.message, true);
        closeModal();
    }
}

async function handleProblemSubmit() {
    const problemData = {
        lineNumber: parseInt(document.getElementById('pLineNumber').value),
        type: document.getElementById('pType').value,
        pFixes: document.getElementById('pFixes').value,
        pSpecial: document.getElementById('pSpecial').value,
        pUnderground: document.getElementById('pUnderground').checked,
        finished: document.getElementById('pFinished').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentProblemId) {
            await db.collection('problems').doc(currentProblemId).update(problemData);
            showNotification('Problem updated successfully!');
        } else {
            problemData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('problems').add(problemData);
            showNotification('New problem reported successfully!');
        }
        
        closeModal();
        loadProblems();
        currentProblemId = null;
    } catch (error) {
        showNotification('Error saving problem: ' + error.message, true);
    }
}

async function deleteProblem(id) {
    if (confirm('Are you sure you want to delete this problem report?')) {
        try {
            await db.collection('problems').doc(id).delete();
            showNotification('Problem deleted successfully!');
            loadProblems();
            searchProblem();
        } catch (error) {
            showNotification('Error deleting problem: ' + error.message, true);
        }
    }
}

// Repair Functions
function showRepairForm(id = null) {
    showModal('repairForm', id);
}

async function loadRepairs() {
    try {
        const snapshot = await db.collection('repairs')
            .where('rFinished', '==', false)
            .get();
            
        const listDiv = document.getElementById('repairsList');
        listDiv.innerHTML = '';

        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="no-results">No active repairs found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const repair = doc.data();
            listDiv.innerHTML += `
                <div class="list-item">
                    <div class="list-item-header">
                        <h3>Line ${repair.rLineNumber}</h3>
                        <div class="list-item-actions">
                            <button class="edit-btn" onclick="showRepairForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteRepair('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Phone:</strong> ${repair.rPhone || 'N/A'}</p>
                    <p><strong>Length:</strong> ${repair.rLength || 'N/A'}</p>
                    <p><strong>Date:</strong> ${repair.rDate}</p>
                    <p class="timestamp">Reported: ${repair.createdAt?.toDate().toLocaleString()}</p>
                </div>
            `;
        });
    } catch (error) {
        showNotification('Error loading repairs: ' + error.message, true);
    }
}

async function searchRepair() {
    const lineNumber = document.getElementById('searchRepair').value;
    const resultsDiv = document.getElementById('repairSearchResults');
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

    try {
        let query = db.collection('repairs');
        if (lineNumber) {
            query = query.where('rLineNumber', '==', parseInt(lineNumber));
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        resultsDiv.innerHTML = '';

        if (snapshot.empty) {
            resultsDiv.innerHTML = '<p class="no-results">No repairs found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const repair = doc.data();
            resultsDiv.innerHTML += `
                <div class="list-item ${repair.rFinished ? 'finished' : ''}">
                    <div class="list-item-header">
                        <h3>Line ${repair.rLineNumber}</h3>
                        <div class="list-item-actions">
                            <button class="edit-btn" onclick="showRepairForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteRepair('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Status:</strong> ${repair.rFinished ? '✅ Finished' : '⚠️ Active'}</p>
                    <p><strong>Phone:</strong> ${repair.rPhone || 'N/A'}</p>
                    <p><strong>Length:</strong> ${repair.rLength || 'N/A'}</p>
                    <p><strong>Date:</strong> ${repair.rDate}</p>
                    <p class="timestamp">Reported: ${repair.createdAt?.toDate().toLocaleString()}</p>
                    ${repair.updatedAt ? `<p class="timestamp">Last Updated: ${repair.updatedAt?.toDate().toLocaleString()}</p>` : ''}
                </div>
            `;
        });
    } catch (error) {
        showNotification('Search failed: ' + error.message, true);
    }
}

async function editRepair(id) {
    try {
        currentRepairId = id;
        document.getElementById('repairFormTitle').textContent = 'Edit Repair';
        
        const doc = await db.collection('repairs').doc(id).get();
        if (!doc.exists) {
            throw new Error('Repair not found');
        }
        
        const data = doc.data();
        document.getElementById('rLineNumber').value = data.rLineNumber;
        document.getElementById('rPhone').value = data.rPhone || '';
        document.getElementById('rLength').value = data.rLength || '';
        document.getElementById('rDate').value = data.rDate;
        document.getElementById('rFinished').checked = data.rFinished || false;
        
    } catch (error) {
        showNotification('Error editing repair: ' + error.message, true);
        closeModal();
    }
}

async function handleRepairSubmit() {
    const repairData = {
        rLineNumber: parseInt(document.getElementById('rLineNumber').value),
        rPhone: document.getElementById('rPhone').value,
        rLength: document.getElementById('rLength').value,
        rDate: document.getElementById('rDate').value,
        rFinished: document.getElementById('rFinished').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentRepairId) {
            await db.collection('repairs').doc(currentRepairId).update(repairData);
            showNotification('Repair updated successfully!');
        } else {
            repairData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('repairs').add(repairData);
            showNotification('New repair added successfully!');
        }
        
        closeModal();
        loadRepairs();
        currentRepairId = null;
    } catch (error) {
        showNotification('Error saving repair: ' + error.message, true);
    }
}

async function deleteRepair(id) {
    if (confirm('Are you sure you want to delete this repair record?')) {
        try {
            await db.collection('repairs').doc(id).delete();
            showNotification('Repair deleted successfully!');
            loadRepairs();
            searchRepair();
        } catch (error) {
            showNotification('Error deleting repair: ' + error.message, true);
        }
    }
}

// Review Functions
function showReviewForm(id = null) {
    showModal('reviewForm', id);
}

function toggleReasonField() {
    const possibility = document.getElementById('revPossibility').value;
    const reasonField = document.getElementById('reasonField');
    reasonField.style.display = possibility === 'NotPossible' ? 'block' : 'none';
}

async function loadReviews() {
    try {
        const snapshot = await db.collection('reviews')
            .where('revFinished', '==', false)
            .get();
            
        const listDiv = document.getElementById('reviewsList');
        listDiv.innerHTML = '';

        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="no-results">No active reviews found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const review = doc.data();
            listDiv.innerHTML += `
                <div class="list-item">
                    <div class="list-item-header">
                        <h3>${review.revPhone}</h3>
                        <div class="list-item-actions">
                            <button class="edit-btn" onclick="showReviewForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteReview('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Name:</strong> ${review.revName || 'N/A'}</p>
                    <p><strong>Box:</strong> ${review.revBox || 'N/A'}</p>
                    <p><strong>Cabinet:</strong> ${review.revCabinet || 'N/A'}</p>
                    <p><strong>Possibility:</strong> ${review.revPossibility}</p>
                    ${review.revPossibility === 'NotPossible' ? `<p><strong>Reason:</strong> ${review.revReason || 'N/A'}</p>` : ''}
                    <p class="timestamp">Reported: ${review.createdAt?.toDate().toLocaleString()}</p>
                </div>
            `;
        });
    } catch (error) {
        showNotification('Error loading reviews: ' + error.message, true);
    }
}

async function searchReview() {
    const phoneNumber = document.getElementById('searchReview').value;
    const resultsDiv = document.getElementById('reviewSearchResults');
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

    try {
        let query = db.collection('reviews');
        if (phoneNumber) {
            query = query.where('revPhone', '==', phoneNumber);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        resultsDiv.innerHTML = '';

        if (snapshot.empty) {
            resultsDiv.innerHTML = '<p class="no-results">No reviews found</p>';
            return;
        }

        snapshot.forEach(doc => {
            const review = doc.data();
            resultsDiv.innerHTML += `
                <div class="list-item ${review.revFinished ? 'finished' : ''}">
                    <div class="list-item-header">
                        <h3>${review.revPhone}</h3>
                        <div class="list-item-actions">
                            <button class="edit-btn" onclick="showReviewForm('${doc.id}')">✏️</button>
                            <button class="delete-btn" onclick="deleteReview('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                    <p><strong>Status:</strong> ${review.revFinished ? '✅ Finished' : '⚠️ Active'}</p>
                    <p><strong>Name:</strong> ${review.revName || 'N/A'}</p>
                    <p><strong>Box:</strong> ${review.revBox || 'N/A'}</p>
                    <p><strong>Cabinet:</strong> ${review.revCabinet || 'N/A'}</p>
                    <p><strong>Possibility:</strong> ${review.revPossibility}</p>
                    ${review.revPossibility === 'NotPossible' ? `<p><strong>Reason:</strong> ${review.revReason || 'N/A'}</p>` : ''}
                    <p class="timestamp">Reported: ${review.createdAt?.toDate().toLocaleString()}</p>
                    ${review.updatedAt ? `<p class="timestamp">Last Updated: ${review.updatedAt?.toDate().toLocaleString()}</p>` : ''}
                </div>
            `;
        });
    } catch (error) {
        showNotification('Search failed: ' + error.message, true);
    }
}

async function editReview(id) {
    try {
        currentReviewId = id;
        document.getElementById('reviewFormTitle').textContent = 'Edit Review';
        
        const doc = await db.collection('reviews').doc(id).get();
        if (!doc.exists) {
            throw new Error('Review not found');
        }
        
        const data = doc.data();
        document.getElementById('revPhone').value = data.revPhone;
        document.getElementById('revName').value = data.revName || '';
        document.getElementById('revBox').value = data.revBox || '';
        document.getElementById('revCabinet').value = data.revCabinet || '';
        document.getElementById('revPossibility').value = data.revPossibility || 'Possible';
        document.getElementById('revReason').value = data.revReason || '';
        document.getElementById('revFinished').checked = data.revFinished || false;
        
        toggleReasonField();
        
    } catch (error) {
        showNotification('Error editing review: ' + error.message, true);
        closeModal();
    }
}

async function handleReviewSubmit() {
    const reviewData = {
        revPhone: document.getElementById('revPhone').value,
        revName: document.getElementById('revName').value,
        revBox: document.getElementById('revBox').value,
        revCabinet: document.getElementById('revCabinet').value,
        revPossibility: document.getElementById('revPossibility').value,
        revReason: document.getElementById('revReason').value,
        revFinished: document.getElementById('revFinished').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentReviewId) {
            await db.collection('reviews').doc(currentReviewId).update(reviewData);
            showNotification('Review updated successfully!');
        } else {
            reviewData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('reviews').add(reviewData);
            showNotification('New review added successfully!');
        }
        
        closeModal();
        loadReviews();
        currentReviewId = null;
    } catch (error) {
        showNotification('Error saving review: ' + error.message, true);
    }
}

async function deleteReview(id) {
    if (confirm('Are you sure you want to delete this review record?')) {
        try {
            await db.collection('reviews').doc(id).delete();
            showNotification('Review deleted successfully!');
            loadReviews();
            searchReview();
        } catch (error) {
            showNotification('Error deleting review: ' + error.message, true);
        }
    }
}

// Calculator Function
function calculatePort() {
    const portNumber = parseInt(document.getElementById('portInput').value);
    const resultDiv = document.getElementById('portResult');

    if (!portNumber || portNumber < 1 || portNumber > 1024) {
        resultDiv.innerHTML = '<p class="error">Please enter a valid port number (1-1024)</p>';
        return;
    }

    const row = Math.ceil(portNumber / 16);
    const column = ((portNumber - 1) % 16) + 1;

    resultDiv.innerHTML = `
        <h3>Calculation Result</h3>
        <p><strong>Port:</strong> ${portNumber}</p>
        <p><strong>Row:</strong> ${row}</p>
        <p><strong>Column:</strong> ${column}</p>
    `;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showMainMenu();
});

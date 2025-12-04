// Workflow Engine JavaScript Functions
let selectedWorkflowId = null;

// Workflow API Functions
async function createWorkflow() {
    const audioUrl = document.getElementById('workflowAudioUrl').value.trim();
    const language = document.getElementById('workflowLanguage').value;
    
    if (!audioUrl) {
        showStatus('Please enter an audio URL', 'error');
        return;
    }

    try {
        showStatus(`Creating workflow (${language})...`, 'info');
        const response = await axios.post(`${API_BASE_URL}/workflow`, { audioUrl, language });
        
        showStatus('Workflow created successfully!', 'success');
        loadWorkflows();
        selectWorkflow(response.data.data.id);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showStatus(`Error: ${message}`, 'error');
    }
}

async function loadWorkflows() {
    try {
        const statusFilter = document.getElementById('statusFilter').value;
        const url = `${API_BASE_URL}/workflows?limit=10${statusFilter ? `&status=${statusFilter}` : ''}`;
        
        const response = await axios.get(url);
        displayWorkflows(response.data.data.workflows);
        showStatus('Workflows loaded successfully', 'success');
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showStatus(`Error loading workflows: ${message}`, 'error');
    }
}

async function selectWorkflow(workflowId) {
    try {
        selectedWorkflowId = workflowId;
        const response = await axios.get(`${API_BASE_URL}/workflow/${workflowId}`);
        displayWorkflowDetails(response.data.data);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showStatus(`Error loading workflow details: ${message}`, 'error');
    }
}

async function transitionWorkflow() {
    if (!selectedWorkflowId) {
        showStatus('Please select a workflow first', 'error');
        return;
    }

    const newStatus = document.getElementById('newStatus').value;
    const comment = document.getElementById('transitionComment').value;
    const reviewedBy = document.getElementById('reviewedBy').value;

    if (!newStatus) {
        showStatus('Please select a new status', 'error');
        return;
    }

    try {
        showStatus(`Transitioning workflow to ${newStatus}...`, 'info');
        await axios.put(`${API_BASE_URL}/workflow/${selectedWorkflowId}/transition`, {
            newStatus,
            comment,
            reviewedBy
        });
        
        showStatus('Workflow transitioned successfully!', 'success');
        loadWorkflows();
        selectWorkflow(selectedWorkflowId);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showStatus(`Error: ${message}`, 'error');
    }
}

async function loadStatistics() {
    try {
        const response = await axios.get(`${API_BASE_URL}/workflow/stats`);
        displayStatistics(response.data.data);
        showStatus('Statistics loaded successfully', 'success');
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showStatus(`Error loading statistics: ${message}`, 'error');
    }
}

// Display Functions
function displayWorkflows(workflows) {
    const listDiv = document.getElementById('workflowsList');
    
    if (!workflows || workflows.length === 0) {
        listDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No workflows found</p>';
        return;
    }
    
    const html = workflows.map(w => `
        <div class="border border-gray-200 rounded-lg p-3 hover:bg-purple-50 cursor-pointer transition-colors"
             onclick="selectWorkflow('${w._id}')">
            <div class="flex justify-between items-center mb-2">
                <div class="text-sm font-medium text-gray-800 truncate flex-1">${w.audioUrl}</div>
                <span class="status-badge status-${w.workflowStatus || 'transcription'} ml-2"></span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>${w.workflowStatus || 'transcription'}</span>
                <span>${formatDate(w.createdAt)}</span>
            </div>
        </div>
    `).join('');
    
    listDiv.innerHTML = html;
}

function displayWorkflowDetails(workflow) {
    const detailsDiv = document.getElementById('workflowDetails');
    const controlsDiv = document.getElementById('transitionControls');
    
    const html = `
        <div class="space-y-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Current Status</h3>
                <div class="flex items-center">
                    <span class="status-badge status-${workflow.currentStatus} mr-2"></span>
                    <span class="capitalize font-medium">${workflow.currentStatus}</span>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Audio URL</h3>
                <p class="text-sm text-gray-600 break-all">${workflow.id}</p>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Workflow History</h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    ${workflow.workflowHistory.map(h => `
                        <div class="text-xs bg-gray-50 p-2 rounded">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-medium">${h.status}</span>
                                <span class="text-gray-500">${formatDate(h.timestamp)}</span>
                            </div>
                            ${h.comment ? `<p class="text-gray-600">${h.comment}</p>` : ''}
                            ${h.reviewedBy ? `<p class="text-gray-500">By: ${h.reviewedBy}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    detailsDiv.innerHTML = html;
    
    // Update transition controls
    const newStatusSelect = document.getElementById('newStatus');
    newStatusSelect.innerHTML = '<option value="">Select status...</option>' +
        workflow.canTransition.map(status => `<option value="${status}">${status}</option>`).join('');
    
    if (workflow.canTransition.length > 0) {
        controlsDiv.classList.remove('hidden');
    } else {
        controlsDiv.classList.add('hidden');
    }
}

function displayStatistics(stats) {
    // Update stat cards
    document.getElementById('stat-transcription').textContent = stats.statistics.transcription || 0;
    document.getElementById('stat-review').textContent = stats.statistics.review || 0;
    document.getElementById('stat-approval').textContent = stats.statistics.approval || 0;
    document.getElementById('stat-completed').textContent = stats.statistics.completed || 0;
    
    // Update content area
    const contentDiv = document.getElementById('statisticsContent');
    contentDiv.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <h3 class="font-semibold text-gray-800 mb-2">Status Breakdown</h3>
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span>Transcription:</span>
                        <span>${stats.statistics.transcription || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Review:</span>
                        <span>${stats.statistics.review || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Approval:</span>
                        <span>${stats.statistics.approval || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Completed:</span>
                        <span>${stats.statistics.completed || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Rejected:</span>
                        <span>${stats.statistics.rejected || 0}</span>
                    </div>
                </div>
            </div>
            <div>
                <h3 class="font-semibold text-gray-800 mb-2">Summary</h3>
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span>Total Workflows:</span>
                        <span class="font-semibold">${stats.total}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Active (In Progress):</span>
                        <span>${(stats.statistics.transcription || 0) + (stats.statistics.review || 0) + (stats.statistics.approval || 0)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Completion Rate:</span>
                        <span>${stats.total > 0 ? Math.round(((stats.statistics.completed || 0) / stats.total) * 100) : 0}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

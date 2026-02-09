const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(express.static(__dirname));

const dataFile = path.join(__dirname, 'tasks.json');
const agentStatusFile = path.join(__dirname, 'agent-status.json');

function readData() {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { projects: [] };
    }
}

function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

// GET all projects
app.get('/api/projects', (req, res) => {
    const data = readData();
    res.json(data);
});

// POST new project
app.post('/api/projects', (req, res) => {
    const { name, description, docs } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Project name required' });
    }

    const data = readData();
    const newProject = {
        id: `proj-${uuidv4().slice(0, 8)}`,
        name,
        description: description || '',
        docs: docs || '# ' + name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        tasks: [],
        createdAt: new Date().toISOString()
    };

    data.projects.push(newProject);
    writeData(data);

    console.log(`[PROJECT] Created: "${name}" (${newProject.id})`);
    res.status(201).json(newProject);
});

// PUT update project
app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const data = readData();
    const projectIndex = data.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    data.projects[projectIndex] = { ...data.projects[projectIndex], ...updates };
    writeData(data);

    res.json(data.projects[projectIndex]);
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const projectIndex = data.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const removedProject = data.projects.splice(projectIndex, 1)[0];
    writeData(data);

    console.log(`[PROJECT] Deleted: "${removedProject.name}"`);
    res.json({ success: true });
});

// POST new task to project
app.post('/api/projects/:projectId/tasks', (req, res) => {
    const { projectId } = req.params;
    const { title, description, status, priority, date, featureFile } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title required' });
    }

    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const newTask = {
        id: uuidv4().slice(0, 8),
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'medium',
        date: date || new Date().toLocaleDateString('de-DE'),
        featureFile: featureFile || null,
        createdAt: new Date().toISOString()
    };

    project.tasks.push(newTask);
    writeData(data);

    console.log(`[TASK] Created: "${title}" in "${project.name}"`);
    res.status(201).json(newTask);
});

// PUT update task status
app.put('/api/projects/:projectId/tasks/:taskId', (req, res) => {
    const { projectId, taskId } = req.params;
    const updates = req.body;

    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = project.tasks[taskIndex].status;
    project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...updates };
    writeData(data);

    if (updates.status && updates.status !== oldStatus) {
        console.log(`[TASK] "${project.tasks[taskIndex].title}": ${oldStatus} → ${updates.status}`);
    }

    res.json(project.tasks[taskIndex]);
});

// DELETE task
app.delete('/api/projects/:projectId/tasks/:taskId', (req, res) => {
    const { projectId, taskId } = req.params;

    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const removedTask = project.tasks.splice(taskIndex, 1)[0];
    writeData(data);

    console.log(`[TASK] Removed: "${removedTask.title}" from "${project.name}"`);
    res.json({ success: true });
});

// Status endpoint
app.get('/api/status', (req, res) => {
    const data = readData();
    const stats = {
        projects: data.projects.length,
        totalTasks: data.projects.reduce((sum, p) => sum + p.tasks.length, 0),
        tasksByStatus: {
            todo: 0,
            inProgress: 0,
            done: 0
        }
    };

    data.projects.forEach(p => {
        p.tasks.forEach(t => {
            if (t.status === 'todo') stats.tasksByStatus.todo++;
            if (t.status === 'in-progress') stats.tasksByStatus.inProgress++;
            if (t.status === 'done') stats.tasksByStatus.done++;
        });
    });

    res.json(stats);
});

// Molt Status - Queue
app.get('/api/molt-status', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const todoFile = path.join(__dirname, '..', 'MOLT_TODO.md');
        
        // Parse TODO file to extract tasks
        let queue = [];
        try {
            const content = fs.readFileSync(todoFile, 'utf8');
            const lines = content.split('\n');
            let section = null;
            
            lines.forEach(line => {
                if (line.includes('Completed')) section = 'completed';
                else if (line.includes('Next Up')) section = 'pending';
                else if (line.startsWith('- [x]')) {
                    queue.push({
                        title: line.replace('- [x] ', '').split('(')[0].trim(),
                        description: line.includes('(') ? line.split('(')[1].replace(')', '') : '',
                        status: 'completed',
                        completed: true
                    });
                } else if (line.startsWith('- [ ]')) {
                    queue.push({
                        title: line.replace('- [ ] ', '').split('(')[0].trim(),
                        description: line.includes('(') ? line.split('(')[1].replace(')', '') : '',
                        status: 'pending',
                        completed: false
                    });
                }
            });
        } catch (err) {
            queue = [];
        }

        res.json({ queue });
    } catch (error) {
        res.json({ queue: [] });
    }
});

// Activity Log
app.get('/api/activity', (req, res) => {
    try {
        const activityFile = path.join(__dirname, 'activity.json');
        const content = fs.readFileSync(activityFile, 'utf8');
        const data = JSON.parse(content);
        res.json(data);
    } catch (error) {
        res.json({ activities: [] });
    }
});

// Get agent status
app.get('/api/agent-status', (req, res) => {
    try {
        if (fs.existsSync(agentStatusFile)) {
            const data = JSON.parse(fs.readFileSync(agentStatusFile, 'utf8'));
            res.json(data);
        } else {
            res.json({ status: 'available', task: null, updatedAt: new Date().toISOString() });
        }
    } catch (error) {
        res.json({ status: 'available', task: null, updatedAt: new Date().toISOString() });
    }
});

// Update agent status
app.post('/api/agent-status', (req, res) => {
    try {
        const data = {
            status: req.body.status || 'available',
            task: req.body.task || null,
            updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(agentStatusFile, JSON.stringify(data, null, 2));
        res.json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new activity entry
app.post('/api/activity', (req, res) => {
    try {
        const activityFile = path.join(__dirname, 'activity.json');
        let data = { activities: [] };
        
        if (fs.existsSync(activityFile)) {
            data = JSON.parse(fs.readFileSync(activityFile, 'utf8'));
        }
        
        const newActivity = {
            id: String(Date.now()),
            timestamp: new Date().toISOString(),
            type: req.body.type || 'update',
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'completed',
            project: req.body.project || null
        };
        
        data.activities.push(newActivity);
        fs.writeFileSync(activityFile, JSON.stringify(data, null, 2));
        
        res.json({ success: true, activity: newActivity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get feature file content by task ID
// Looks up the task's featureFile field and loads that file
app.get('/api/projects/:projectId/features/:taskId', (req, res) => {
    const { projectId, taskId } = req.params;
    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    if (!project.projectPath) {
        return res.status(400).json({ error: 'Kein Projektpfad konfiguriert' });
    }

    // Find the task to get its featureFile
    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task nicht gefunden' });
    }

    if (!task.featureFile) {
        return res.status(404).json({ error: 'Keine Feature-Datei verknüpft' });
    }

    try {
        // featureFile can be stored as "features/KB-002-name.md" OR just "KB-002-name.md"
        // Try to resolve it intelligently
        let filePath = path.join(project.projectPath, task.featureFile);
        
        // If not found, try adding features/ prefix
        if (!fs.existsSync(filePath) && !task.featureFile.startsWith('features/')) {
            const withPrefix = path.join(project.projectPath, 'features', task.featureFile);
            if (fs.existsSync(withPrefix)) {
                filePath = withPrefix;
            }
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Feature-Datei nicht gefunden', path: task.featureFile });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(task.featureFile);

        res.json({ 
            id: taskId,
            filename: filename,
            content: content,
            path: filePath,
            featureFile: task.featureFile
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update feature file content by task ID
app.put('/api/projects/:projectId/features/:taskId', (req, res) => {
    const { projectId, taskId } = req.params;
    const { content } = req.body;
    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    if (!project.projectPath) {
        return res.status(400).json({ error: 'Kein Projektpfad konfiguriert' });
    }

    // Find the task to get its featureFile
    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task nicht gefunden' });
    }

    if (!task.featureFile) {
        return res.status(404).json({ error: 'Keine Feature-Datei verknüpft' });
    }

    try {
        // featureFile can be stored as "features/KB-002-name.md" OR just "KB-002-name.md"
        // Try to resolve it intelligently
        let filePath = path.join(project.projectPath, task.featureFile);
        
        // If not found, try adding features/ prefix
        if (!fs.existsSync(filePath) && !task.featureFile.startsWith('features/')) {
            const withPrefix = path.join(project.projectPath, 'features', task.featureFile);
            if (fs.existsSync(withPrefix)) {
                filePath = withPrefix;
            }
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Feature-Datei nicht gefunden', path: task.featureFile });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        const filename = path.basename(task.featureFile);

        // Update task title from first line if desired
        const firstLine = content.split('\n')[0].replace(/^#+\s*/, '');
        if (firstLine) {
            task.title = firstLine;
            writeData(data);
        }

        res.json({ 
            success: true,
            id: taskId,
            filename: filename,
            message: 'Feature aktualisiert'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync Features from Project
app.post('/api/projects/:projectId/sync-features', (req, res) => {
    const { projectId } = req.params;
    const data = readData();
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    try {
        // Use stored projectPath or from request
        const projectPath = project.projectPath || req.body.projectPath;
        if (!projectPath) {
            return res.status(400).json({ error: 'projectPath required' });
        }

        const featuresPath = path.join(projectPath, 'features');
        
        if (!fs.existsSync(featuresPath)) {
            return res.json({ synced: 0, tasks: [] });
        }

        const files = fs.readdirSync(featuresPath);
        const featureFiles = files.filter(f => f.startsWith('PROJ-') && f.endsWith('.md'));

        let syncedCount = 0;
        const newTasks = [];

        featureFiles.forEach(file => {
            const filePath = path.join(featuresPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extract feature name from file
            const match = file.match(/PROJ-(\d+)-(.+)\.md/);
            if (!match) return;

            const featureNum = match[1];
            const featureName = match[2].replace(/-/g, ' ');
            const firstLine = content.split('\n')[0].replace(/^#+\s*/, '');
            const title = firstLine || featureName;

            // Check if task already exists
            const existingTask = project.tasks.find(t => t.id === `PROJ-${featureNum}`);
            
            if (!existingTask) {
                const newTask = {
                    id: `PROJ-${featureNum}`,
                    title: title,
                    description: `Feature specification - Ready for Architecture`,
                    status: 'review',
                    priority: 'high',
                    date: new Date().toLocaleDateString('de-DE'),
                    featureFile: file,
                    createdAt: new Date().toISOString()
                };
                
                project.tasks.push(newTask);
                newTasks.push(newTask);
                syncedCount++;
            }
        });

        writeData(data);
        console.log(`[SYNC] ${syncedCount} features synced for project "${project.name}"`);
        
        res.json({ 
            synced: syncedCount, 
            tasks: newTasks,
            message: `${syncedCount} feature(s) synced successfully`
        });
    } catch (error) {
        console.error('Error syncing features:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// Context Files API (Agent Configuration)
// ==========================================

const WORKSPACE_PATH = process.env.OPENCLAW_WORKSPACE || '/data/.openclaw/workspace';
const CONTEXT_FILES = [
    { name: 'MEMORY.md', description: 'Langzeit-Gedächtnis & Notizen' },
    { name: 'AGENTS.md', description: 'Agent-Verhaltensregeln' },
    { name: 'SOUL.md', description: 'Persönlichkeit & Werte' },
    { name: 'USER.md', description: 'Infos über den User' },
    { name: 'TOOLS.md', description: 'Tool-Konfiguration & Notizen' },
    { name: 'IDENTITY.md', description: 'Name, Vibe, Avatar' },
    { name: 'HEARTBEAT.md', description: 'Periodische Aufgaben' }
];

// GET all context files
app.get('/api/context-files', (req, res) => {
    const files = CONTEXT_FILES.map(file => {
        const filePath = path.join(WORKSPACE_PATH, file.name);
        let exists = false;
        let size = 0;
        let modifiedAt = null;
        
        try {
            const stats = fs.statSync(filePath);
            exists = true;
            size = stats.size;
            modifiedAt = stats.mtime.toISOString();
        } catch (err) {
            // File doesn't exist
        }
        
        return {
            ...file,
            exists,
            size,
            modifiedAt
        };
    });
    
    res.json({ files });
});

// GET single context file content
app.get('/api/context-files/:filename', (req, res) => {
    const { filename } = req.params;
    
    // Security: Only allow predefined files
    const allowed = CONTEXT_FILES.find(f => f.name === filename);
    if (!allowed) {
        return res.status(403).json({ error: 'Datei nicht erlaubt' });
    }
    
    const filePath = path.join(WORKSPACE_PATH, filename);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        res.json({
            name: filename,
            description: allowed.description,
            content,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString()
        });
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.json({
                name: filename,
                description: allowed.description,
                content: '',
                exists: false
            });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// PUT update context file
app.put('/api/context-files/:filename', (req, res) => {
    const { filename } = req.params;
    const { content } = req.body;
    
    // Security: Only allow predefined files
    const allowed = CONTEXT_FILES.find(f => f.name === filename);
    if (!allowed) {
        return res.status(403).json({ error: 'Datei nicht erlaubt' });
    }
    
    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content required' });
    }
    
    const filePath = path.join(WORKSPACE_PATH, filename);
    
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        const stats = fs.statSync(filePath);
        
        console.log(`[CONTEXT] Updated: ${filename}`);
        
        res.json({
            success: true,
            name: filename,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// File Browser API
// ==========================================

const IGNORED_DIRS = ['node_modules', '.git', '.next', 'dist', '.turbo', '__pycache__', '.cache', 'coverage'];
const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = path.extname(filename).toLowerCase();
    const icons = {
        '.ts': '🟦',
        '.tsx': '⚛️',
        '.js': '🟨',
        '.jsx': '⚛️',
        '.json': '📋',
        '.md': '📝',
        '.css': '🎨',
        '.scss': '🎨',
        '.html': '🌐',
        '.py': '🐍',
        '.yml': '⚙️',
        '.yaml': '⚙️',
        '.env': '🔒',
        '.gitignore': '📦',
        '.sh': '💻',
        '.sql': '🗃️',
        '.svg': '🖼️',
        '.png': '🖼️',
        '.jpg': '🖼️',
        '.jpeg': '🖼️'
    };
    return icons[ext] || '📄';
}

// Build directory tree recursively
function buildFileTree(dirPath, relativePath = '') {
    const items = [];
    
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            // Skip ignored directories and files
            if (IGNORED_DIRS.includes(entry.name) || IGNORED_FILES.includes(entry.name)) {
                continue;
            }
            
            const fullPath = path.join(dirPath, entry.name);
            const relPath = path.join(relativePath, entry.name);
            
            if (entry.isDirectory()) {
                const children = buildFileTree(fullPath, relPath);
                items.push({
                    name: entry.name,
                    path: relPath,
                    type: 'directory',
                    icon: '📁',
                    children: children
                });
            } else {
                const stats = fs.statSync(fullPath);
                items.push({
                    name: entry.name,
                    path: relPath,
                    type: 'file',
                    icon: getFileIcon(entry.name),
                    size: stats.size,
                    modifiedAt: stats.mtime.toISOString()
                });
            }
        }
        
        // Sort: directories first, then files, alphabetically
        items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
    } catch (error) {
        console.error('Error reading directory:', error.message);
    }
    
    return items;
}

// GET file tree for project
app.get('/api/projects/:id/files', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const project = data.projects.find(p => p.id === id);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.projectPath) {
        return res.status(400).json({ error: 'No project path configured', needsPath: true });
    }

    if (!fs.existsSync(project.projectPath)) {
        return res.status(404).json({ error: 'Project path does not exist', path: project.projectPath });
    }

    try {
        const tree = buildFileTree(project.projectPath);
        res.json({
            projectPath: project.projectPath,
            tree: tree
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET file content
app.get('/api/projects/:id/files/*', (req, res) => {
    const { id } = req.params;
    let filePath = req.params[0]; // Everything after /files/
    
    const data = readData();
    const project = data.projects.find(p => p.id === id);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.projectPath) {
        return res.status(400).json({ error: 'No project path configured' });
    }

    let fullPath = path.join(project.projectPath, filePath);
    
    // If file not found and looks like a feature file, try features/ prefix
    if (!fs.existsSync(fullPath) && !filePath.startsWith('features/') && filePath.match(/^[A-Z]+-\d+-.*\.md$/)) {
        const withPrefix = path.join(project.projectPath, 'features', filePath);
        if (fs.existsSync(withPrefix)) {
            fullPath = withPrefix;
            filePath = 'features/' + filePath;
        }
    }
    
    // Security: Ensure the path is within the project directory
    const normalizedProject = path.resolve(project.projectPath);
    const normalizedFile = path.resolve(fullPath);
    
    if (!normalizedFile.startsWith(normalizedProject)) {
        return res.status(403).json({ error: 'Access denied: Path traversal detected' });
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is a directory' });
        }
        
        // Check file size (limit to 1MB for text files)
        if (stats.size > 1024 * 1024) {
            return res.status(413).json({ error: 'File too large (max 1MB)' });
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        
        res.json({
            path: filePath,
            name: path.basename(filePath),
            content: content,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            extension: ext,
            icon: getFileIcon(path.basename(filePath))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT save file content
app.put('/api/projects/:id/files/*', (req, res) => {
    const { id } = req.params;
    let filePath = req.params[0];
    const { content } = req.body;
    
    const data = readData();
    const project = data.projects.find(p => p.id === id);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.projectPath) {
        return res.status(400).json({ error: 'No project path configured' });
    }

    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content required' });
    }

    let fullPath = path.join(project.projectPath, filePath);
    
    // If file not found and looks like a feature file, try features/ prefix
    if (!fs.existsSync(fullPath) && !filePath.startsWith('features/') && filePath.match(/^[A-Z]+-\d+-.*\.md$/)) {
        const withPrefix = path.join(project.projectPath, 'features', filePath);
        if (fs.existsSync(withPrefix)) {
            fullPath = withPrefix;
            filePath = 'features/' + filePath;
        }
    }
    
    // Security: Ensure the path is within the project directory
    const normalizedProject = path.resolve(project.projectPath);
    const normalizedFile = path.resolve(fullPath);
    
    if (!normalizedFile.startsWith(normalizedProject)) {
        return res.status(403).json({ error: 'Access denied: Path traversal detected' });
    }

    try {
        // Create directory if it doesn't exist
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        const stats = fs.statSync(fullPath);
        
        console.log(`[FILE] Saved: ${filePath} in project "${project.name}"`);
        
        res.json({
            success: true,
            path: filePath,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CHAT API - OpenClaw Integration
// ============================================

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

const chatSessionsDir = path.join(__dirname, 'data', 'chat-sessions');

// Ensure chat sessions directory exists
if (!fs.existsSync(chatSessionsDir)) {
    fs.mkdirSync(chatSessionsDir, { recursive: true });
}

function getChatSessionsFile(projectId) {
    return path.join(chatSessionsDir, `${projectId}.json`);
}

function readChatSessions(projectId) {
    const file = getChatSessionsFile(projectId);
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (error) {
        console.error(`Error reading chat sessions for ${projectId}:`, error);
    }
    return { sessions: [] };
}

function writeChatSessions(projectId, data) {
    const file = getChatSessionsFile(projectId);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Build context for OpenClaw
function buildProjectContext(project, taskId = null) {
    let context = `Du arbeitest im Projekt "${project.name}".\n\n`;
    
    if (project.docs) {
        context += `## Projekt-Dokumentation\n${project.docs}\n\n`;
    }
    
    context += `## Tasks Übersicht\n`;
    const statusEmoji = { 'done': '✅', 'in-progress': '🟡', 'todo': '🔵' };
    
    for (const task of project.tasks || []) {
        const emoji = statusEmoji[task.status] || '⚪';
        context += `- ${task.id} ${emoji} ${task.title} (${task.status})\n`;
    }
    
    if (taskId) {
        const task = project.tasks?.find(t => t.id === taskId);
        if (task) {
            context += `\n## Aktueller Task-Fokus: ${task.id}\n`;
            context += `**Titel:** ${task.title}\n`;
            context += `**Status:** ${task.status}\n`;
            context += `**Priorität:** ${task.priority || 'medium'}\n`;
            if (task.description) {
                context += `**Beschreibung:**\n${task.description}\n`;
            }
        }
    }
    
    context += `\nNutze den Agent-Workflow (Requirements → Architect → Dev → QA → DevOps) für strukturierte Arbeit.`;
    
    return context;
}

// GET chat sessions for a project
app.get('/api/projects/:projectId/chat/sessions', (req, res) => {
    const { projectId } = req.params;
    const data = readChatSessions(projectId);
    
    // Return sessions without full message history (for list view)
    const sessions = data.sessions.map(s => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        messageCount: s.messages?.length || 0,
        lastMessageAt: s.messages?.length > 0 ? s.messages[s.messages.length - 1].timestamp : null
    }));
    
    res.json({ sessions });
});

// POST create new chat session
app.post('/api/projects/:projectId/chat/sessions', (req, res) => {
    const { projectId } = req.params;
    const { title, taskId } = req.body;
    
    console.log(`[CHAT] Creating session - title: "${title}", taskId: "${taskId}"`);
    
    const data = readChatSessions(projectId);
    
    const newSession = {
        id: uuidv4().slice(0, 8),
        title: title || 'Neue Session',
        taskId: taskId || null,
        createdAt: new Date().toISOString(),
        messages: []
    };
    
    data.sessions.unshift(newSession); // Add to beginning
    writeChatSessions(projectId, data);
    
    console.log(`[CHAT] New session "${newSession.title}" for project ${projectId}`);
    res.status(201).json(newSession);
});

// GET single chat session with messages
app.get('/api/projects/:projectId/chat/sessions/:sessionId', (req, res) => {
    const { projectId, sessionId } = req.params;
    const data = readChatSessions(projectId);
    
    const session = data.sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
});

// DELETE chat session
app.delete('/api/projects/:projectId/chat/sessions/:sessionId', (req, res) => {
    const { projectId, sessionId } = req.params;
    const data = readChatSessions(projectId);
    
    const index = data.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    data.sessions.splice(index, 1);
    writeChatSessions(projectId, data);
    
    console.log(`[CHAT] Deleted session ${sessionId} from project ${projectId}`);
    res.json({ success: true });
});

// POST send message - starts background processing, returns immediately
app.post('/api/projects/:projectId/chat/sessions/:sessionId/messages', async (req, res) => {
    const { projectId, sessionId } = req.params;
    const { content, taskId } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Message content required' });
    }
    
    // Get project for context
    const projectData = readData();
    const project = projectData.projects.find(p => p.id === projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get session
    let chatData = readChatSessions(projectId);
    const session = chatData.sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add user message
    const userMessage = {
        id: uuidv4().slice(0, 8),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
    };
    session.messages.push(userMessage);
    
    // Update session title from first message
    if (session.messages.length === 1) {
        session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    // Add pending assistant message (will be updated as response streams in)
    const assistantMessageId = uuidv4().slice(0, 8);
    const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        status: 'pending',  // pending | streaming | complete | error
        timestamp: new Date().toISOString()
    };
    session.messages.push(assistantMessage);
    
    writeChatSessions(projectId, chatData);
    
    // Return immediately - processing happens in background
    res.json({ 
        status: 'processing',
        userMessage,
        assistantMessageId
    });
    
    // Build context for the chat agent (in background)
    const contextTaskId = taskId || session.taskId;
    const task = contextTaskId ? project.tasks?.find(t => t.id === contextTaskId) : null;
    
    // Build comprehensive system prompt with all context
    let systemPrompt = `Du bist ein fokussierter Entwickler-Agent für das Kanban Board.

# WICHTIG - Projekt-Isolation
Du arbeitest NUR am Projekt "${project.name}". 
Erwähne KEINE anderen Projekte (wie Lernity, etc.) - sie sind nicht relevant für diese Aufgabe.
Halte dich strikt an den aktuellen Task-Kontext.

# Aktueller Kontext

## Projekt: ${project.name}
${project.docs ? `\n### Projekt-Dokumentation\n${project.docs}\n` : ''}
`;

    if (task) {
        systemPrompt += `
## Aktueller Task: ${task.title}
- **ID:** ${task.id}
- **Status:** ${task.status}
- **Priorität:** ${task.priority || 'medium'}
${task.featureFile ? `- **Feature-Spec:** ${task.featureFile} (WICHTIG: Lies diese Datei für Details!)` : ''}

### Task-Beschreibung
${task.description || 'Keine Beschreibung'}
`;
    }

    systemPrompt += `
# Workflow-Regeln
1. Lies zuerst relevante Dateien (Feature-Spec, Code, etc.)
2. Zeige dem User was du analysierst und findest
3. Erkläre was du ändern wirst BEVOR du es tust
4. Mache kleine, nachvollziehbare Änderungen
5. Aktualisiere Task-Status via API wenn fertig
6. Überschreibe NIEMALS die ursprünglichen Anforderungen im Task - füge Status-Updates hinzu!

# API-Endpunkte
- Neuen Task erstellen: POST http://localhost:3000/api/projects/${projectId}/tasks
  Body: {"title": "...", "description": "...", "status": "todo", "priority": "low|medium|high"}
- Task-Status updaten: PUT http://localhost:3000/api/projects/${projectId}/tasks/${contextTaskId || 'TASK_ID'}
  Body: {"status": "todo|in-progress|review|done", "description": "..."}

# WICHTIG: Erlaubte Task-Status
Nur diese Status verwenden: todo, in-progress, review, done
NIEMALS "backlog" oder andere Status verwenden - Tasks werden sonst nicht angezeigt!
Neue Tasks immer mit status: "todo" erstellen.

# Projekt-Pfad
${project.projectPath || '/root/.openclaw/workspace/kanban'}

Antworte auf Deutsch. Sei präzise und zeige deinen Denkprozess.`;

    // Build messages array with conversation history (exclude the empty pending message)
    const messagesForApi = [
        { role: 'system', content: systemPrompt },
        ...session.messages.filter(m => m.status !== 'pending').map(m => ({ role: m.role, content: m.content }))
    ];
    
    console.log('[CHAT] Starting background processing for session', sessionId);
    
    // Process in background (don't await)
    processMessageInBackground(projectId, sessionId, assistantMessageId, messagesForApi);
});

// Background message processing function
async function processMessageInBackground(projectId, sessionId, messageId, messages) {
    try {
        console.log('[CHAT] Background: Calling Gateway for', messageId);
        
        // Update to streaming status
        updateMessageStatus(projectId, sessionId, messageId, 'streaming', '');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            console.log('[CHAT] Background: Timeout after 5 min for', messageId);
            controller.abort();
        }, 300000); // 5 min timeout
        
        // Use NON-streaming for reliability - agent may use tools which don't stream
        const response = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENCLAW_GATEWAY_TOKEN}`
            },
            body: JSON.stringify({
                model: 'openclaw',
                stream: false,  // Non-streaming is more reliable with tool-using agents
                user: `kanban-${projectId}-${sessionId}`,
                messages
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[CHAT] Background: Gateway error:', response.status, errorText);
            updateMessageStatus(projectId, sessionId, messageId, 'error', `Fehler: ${errorText}`);
            return;
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log('[CHAT] Background: Complete for', messageId, '- content:', content.length, 'chars');
        updateMessageStatus(projectId, sessionId, messageId, 'complete', content || '(Keine Antwort vom Agent)');
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('[CHAT] Background: Aborted (timeout) for', messageId);
            updateMessageStatus(projectId, sessionId, messageId, 'error', 'Timeout - Agent hat zu lange gebraucht');
        } else {
            console.error('[CHAT] Background: Error for', messageId, '-', error.message);
            updateMessageStatus(projectId, sessionId, messageId, 'error', `Fehler: ${error.message}`);
        }
    }
}

// Helper to update message status in session file
function updateMessageStatus(projectId, sessionId, messageId, status, content) {
    try {
        const chatData = readChatSessions(projectId);
        const session = chatData.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const message = session.messages.find(m => m.id === messageId);
        if (!message) return;
        
        message.status = status;
        message.content = content;
        message.updatedAt = new Date().toISOString();
        
        writeChatSessions(projectId, chatData);
    } catch (e) {
        console.error('[CHAT] Error updating message status:', e);
    }
}

// GET gateway status (for UI)
app.get('/api/chat/status', async (req, res) => {
    try {
        const response = await fetch(`${OPENCLAW_GATEWAY_URL}/health`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENCLAW_GATEWAY_TOKEN}`
            },
            timeout: 5000
        });
        
        res.json({
            online: response.ok,
            url: OPENCLAW_GATEWAY_URL
        });
    } catch (error) {
        res.json({
            online: false,
            error: error.message
        });
    }
});

// Cleanup stuck messages on startup
function cleanupStuckMessages() {
    const sessionsDir = path.join(__dirname, 'data', 'chat-sessions');
    if (!fs.existsSync(sessionsDir)) return;
    
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
    let cleaned = 0;
    
    for (const file of files) {
        try {
            const filePath = path.join(sessionsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let changed = false;
            
            for (const session of data.sessions) {
                for (const msg of session.messages) {
                    if (msg.role === 'assistant' && (msg.status === 'streaming' || msg.status === 'pending')) {
                        msg.status = 'error';
                        msg.content = msg.content || '⚠️ Server wurde neu gestartet - bitte erneut senden';
                        msg.updatedAt = new Date().toISOString();
                        changed = true;
                        cleaned++;
                    }
                }
            }
            
            if (changed) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            }
        } catch (e) {
            console.error('[CHAT] Cleanup error for', file, e.message);
        }
    }
    
    if (cleaned > 0) {
        console.log(`[CHAT] Cleaned up ${cleaned} stuck messages from previous run`);
    }
}

// Start server
cleanupStuckMessages();

app.listen(PORT, HOST, () => {
    console.log(`\n🦞 OpenClaw Board v2\n`);
    console.log(`   🌐 http://0.0.0.0:${PORT}`);
    console.log(`   📡 API: http://localhost:${PORT}/api/projects`);
    console.log(`   💬 Chat: OpenClaw Gateway at ${OPENCLAW_GATEWAY_URL}\n`);
});

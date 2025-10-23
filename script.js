 // Load todos from localStorage or initialize empty array
        let todos = JSON.parse(localStorage.getItem('todos')) || [];
        let activeTimers = {}; // Store active timer intervals

        // Check notification permission on load
        window.addEventListener('load', () => {
            displayResult(todos);
            checkNotificationPermission();
            initializeTimers(); // Start timers for existing tasks
        });

        // Check and show notification banner if needed
        function checkNotificationPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                document.getElementById('notificationBanner').classList.add('show');
            }
        }

        // Request notification permission
        function requestNotificationPermission() {
            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        document.getElementById('notificationBanner').classList.remove('show');
                        showNotification('Notifications Enabled! 🎉', 'You will receive reminders for your tasks');
                    }
                });
            }
        }

        // Show browser notification
        function showNotification(title, body) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: '✅',
                    badge: '⏰'
                });
            } else {
                // Fallback to alert
                alert(`${title}\n\n${body}`);
            }
        }

        // Toggle timer inputs
        function toggleTimerInputs() {
            const timerInputs = document.getElementById('timerInputs');
            const enableTimer = document.getElementById('enableTimer');
            
            if (enableTimer.checked) {
                timerInputs.classList.add('active');
                // Set default timer values (current date and time + 1 hour)
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                document.getElementById('timerDate').value = oneHourLater.toISOString().split('T')[0];
                document.getElementById('timerTime').value = oneHourLater.toTimeString().slice(0, 5);
            } else {
                timerInputs.classList.remove('active');
            }
        }

        // Form submission handler
        function formHandler(e) {
            e.preventDefault();
            
            const plan = document.getElementById('plan').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const location = document.getElementById('location').value;
            const enableTimer = document.getElementById('enableTimer').checked;

            const task = {
                id: Date.now(), // Unique ID for each task
                plan: plan,
                date: date,
                time: time,
                location: location,
                completed: false
            };

            // Add timer if enabled
            if (enableTimer) {
                const timerDate = document.getElementById('timerDate').value;
                const timerTime = document.getElementById('timerTime').value;
                task.timerTimestamp = new Date(`${timerDate}T${timerTime}`).getTime();
                task.timerCompleted = false;
            }

            todos.push(task);
            saveTodos();
            displayResult(todos);
            
            // Reset form
            e.target.reset();
            document.getElementById('timerInputs').classList.remove('active');
            document.getElementById('enableTimer').checked = false;

            // Start timer if set
            if (task.timerTimestamp) {
                startTimer(task.id);
            }
        }

        // Save todos to localStorage
        function saveTodos() {
            localStorage.setItem('todos', JSON.stringify(todos));
        }

        // Initialize timers for existing tasks
        function initializeTimers() {
            todos.forEach(task => {
                if (task.timerTimestamp && !task.timerCompleted) {
                    startTimer(task.id);
                }
            });
        }

        // Start a timer for a task
        function startTimer(taskId) {
            const task = todos.find(t => t.id === taskId);
            if (!task || !task.timerTimestamp || task.timerCompleted) return;

            // Clear existing timer if any
            if (activeTimers[taskId]) {
                clearInterval(activeTimers[taskId]);
            }

            // Check if timer should trigger immediately
            const now = Date.now();
            if (now >= task.timerTimestamp) {
                triggerTimer(taskId);
                return;
            }

            // Set interval to check every second
            activeTimers[taskId] = setInterval(() => {
                const currentTime = Date.now();
                if (currentTime >= task.timerTimestamp) {
                    triggerTimer(taskId);
                }
            }, 1000);
        }

        // Trigger timer notification
        function triggerTimer(taskId) {
            const task = todos.find(t => t.id === taskId);
            if (!task || task.timerCompleted) return;

            // Clear the interval
            if (activeTimers[taskId]) {
                clearInterval(activeTimers[taskId]);
                delete activeTimers[taskId];
            }

            // Mark timer as completed
            task.timerCompleted = true;
            saveTodos();

            // Show notification
            showNotification(
                '⏰ Task Reminder!',
                `It's time for: ${task.plan}`
            );

            // Update display
            displayResult(todos);
        }

        // Calculate time remaining for timer
        function getTimeRemaining(timestamp) {
            const now = Date.now();
            const diff = timestamp - now;
            
            if (diff <= 0) return 'Time\'s up!';

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 24) {
                const days = Math.floor(hours / 24);
                return `${days}d ${hours % 24}h`;
            } else if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        }

        // Display all tasks
        function displayResult(todoData) {
            const tasksList = document.getElementById('tasksList');
            const taskCount = document.getElementById('taskCount');
            
            if (todoData.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <h4>No tasks yet</h4>
                        <p>Add your first task to get started!</p>
                    </div>
                `;
                taskCount.textContent = '0 tasks';
                return;
            }

            let tasksHTML = '';
            todoData.forEach((task, index) => {
                const completedClass = task.completed ? 'completed' : '';
                const timerHTML = task.timerTimestamp && !task.timerCompleted 
                    ? `<span class="task-timer" id="timer-${task.id}">⏰ ${getTimeRemaining(task.timerTimestamp)}</span>`
                    : task.timerCompleted 
                    ? `<span class="task-timer completed-timer">✅ Timer completed</span>`
                    : '';

                tasksHTML += `
                    <div class="task-item ${completedClass}" data-id="${task.id}">
                        <div class="task-header">
                            <div class="task-plan">${task.plan}</div>
                            ${timerHTML}
                        </div>
                        <div class="task-details">
                            <div class="task-detail">
                                <span class="task-detail-icon">📅</span>
                                <span>${task.date}</span>
                            </div>
                            <div class="task-detail">
                                <span class="task-detail-icon">🕐</span>
                                <span>${task.time}</span>
                            </div>
                            ${task.location ? `
                                <div class="task-detail">
                                    <span class="task-detail-icon">📍</span>
                                    <span>${task.location}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="task-actions">
                            ${!task.completed ? `<button class="task-btn complete-btn" onclick="completeTask(${task.id})">✓ Complete</button>` : ''}
                            <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">🗑 Delete</button>
                        </div>
                    </div>
                `;
            });

            tasksList.innerHTML = tasksHTML;
            taskCount.textContent = `${todoData.length} task${todoData.length !== 1 ? 's' : ''}`;

            // Update active timers every second
            todoData.forEach(task => {
                if (task.timerTimestamp && !task.timerCompleted) {
                    const timerElement = document.getElementById(`timer-${task.id}`);
                    if (timerElement) {
                        setInterval(() => {
                            const remaining = getTimeRemaining(task.timerTimestamp);
                            timerElement.textContent = `⏰ ${remaining}`;
                        }, 1000);
                    }
                }
            });
        }

        // Complete a task
        function completeTask(taskId) {
            const task = todos.find(t => t.id === taskId);
            if (task) {
                task.completed = true;
                saveTodos();
                displayResult(todos);
            }
        }

        // Delete a task
        function deleteTask(taskId) {
            const taskElement = document.querySelector(`[data-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('removing');
                
                // Clear timer if exists
                if (activeTimers[taskId]) {
                    clearInterval(activeTimers[taskId]);
                    delete activeTimers[taskId];
                }

                setTimeout(() => {
                    todos = todos.filter(t => t.id !== taskId);
                    saveTodos();
                    displayResult(todos);
                }, 500);
            }
        }
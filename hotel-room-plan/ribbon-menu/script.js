// Ribbon Menu Controller
class RibbonMenuController {
    constructor() {
        this.currentTab = 'home';
        this.eventListeners = {};
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupButtons();
        this.setupModals();
        this.updateStatusBar();
        this.setupMessageBroadcasting();
    }

    // Tab Switching
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.ribbon-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.ribbon-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.ribbon-tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`#${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.broadcastEvent('tabChanged', { tab: tabName });
    }

    // Button Setup
    setupButtons() {
        // Reservation buttons
        document.getElementById('btn-add-reservation')?.addEventListener('click', () => {
            this.showModal('modal-add-reservation');
            this.populateRoomSelect();
        });

        document.getElementById('btn-delete-reservation')?.addEventListener('click', () => {
            this.broadcastEvent('deleteReservation');
            this.updateStatus('Reservation deleted');
        });

        document.getElementById('btn-edit-reservation')?.addEventListener('click', () => {
            this.broadcastEvent('editReservation');
            this.updateStatus('Edit mode activated');
        });

        // Accommodation buttons
        document.getElementById('btn-add-accommodation')?.addEventListener('click', () => {
            this.showModal('modal-add-accommodation');
        });

        document.getElementById('btn-delete-accommodation')?.addEventListener('click', () => {
            this.broadcastEvent('deleteAccommodation');
            this.updateStatus('Room deleted');
        });

        document.getElementById('btn-edit-accommodation')?.addEventListener('click', () => {
            this.broadcastEvent('editAccommodation');
            this.updateStatus('Edit mode activated');
        });

        // Navigation buttons
        document.getElementById('btn-today')?.addEventListener('click', () => {
            this.broadcastEvent('navigateToToday');
            this.updateStatus('Navigated to today');
        });

        document.getElementById('btn-prev-week')?.addEventListener('click', () => {
            this.broadcastEvent('previousWeek');
            this.updateStatus('Moving to previous week');
        });

        document.getElementById('btn-next-week')?.addEventListener('click', () => {
            this.broadcastEvent('nextWeek');
            this.updateStatus('Moving to next week');
        });

        // View options
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            this.broadcastEvent('zoomIn');
            this.updateStatus('Zoomed in');
        });

        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            this.broadcastEvent('zoomOut');
            this.updateStatus('Zoomed out');
        });

        document.getElementById('btn-reset-zoom')?.addEventListener('click', () => {
            this.broadcastEvent('resetZoom');
            this.updateStatus('Zoom reset');
        });

        // Display toggle buttons
        document.getElementById('btn-show-occupied')?.addEventListener('click', (e) => {
            e.target.closest('button').classList.toggle('active');
            this.broadcastEvent('toggleOccupied', { show: e.target.closest('button').classList.contains('active') });
        });

        document.getElementById('btn-show-available')?.addEventListener('click', (e) => {
            e.target.closest('button').classList.toggle('active');
            this.broadcastEvent('toggleAvailable', { show: e.target.closest('button').classList.contains('active') });
        });

        document.getElementById('btn-show-maintenance')?.addEventListener('click', (e) => {
            e.target.closest('button').classList.toggle('active');
            this.broadcastEvent('toggleMaintenance', { show: e.target.closest('button').classList.contains('active') });
        });

        // Grouping
        document.getElementById('group-by')?.addEventListener('change', (e) => {
            this.broadcastEvent('groupByChanged', { groupBy: e.target.value });
            this.updateStatus(`Grouped by ${e.target.value}`);
        });

        // Analysis tools
        document.getElementById('btn-occupancy-report')?.addEventListener('click', () => {
            this.broadcastEvent('showOccupancyReport');
            this.updateStatus('Generating occupancy report');
        });

        document.getElementById('btn-revenue-report')?.addEventListener('click', () => {
            this.broadcastEvent('showRevenueReport');
            this.updateStatus('Generating revenue report');
        });

        document.getElementById('btn-conflicts')?.addEventListener('click', () => {
            this.broadcastEvent('checkConflicts');
            this.updateStatus('Checking for conflicts');
        });

        // Data tools
        document.getElementById('btn-export')?.addEventListener('click', () => {
            this.broadcastEvent('exportData');
            this.updateStatus('Exporting data');
        });

        document.getElementById('btn-import')?.addEventListener('click', () => {
            this.broadcastEvent('importData');
            this.updateStatus('Importing data');
        });

        document.getElementById('btn-print')?.addEventListener('click', () => {
            this.broadcastEvent('printPlan');
            this.updateStatus('Printing plan');
        });

        // Settings
        document.getElementById('btn-general-settings')?.addEventListener('click', () => {
            this.broadcastEvent('generalSettings');
            this.updateStatus('Opening settings');
        });

        document.getElementById('btn-room-types')?.addEventListener('click', () => {
            this.broadcastEvent('manageRoomTypes');
            this.updateStatus('Managing room types');
        });

        document.getElementById('btn-pricing')?.addEventListener('click', () => {
            this.broadcastEvent('pricingSettings');
            this.updateStatus('Pricing settings');
        });

        // Help
        document.getElementById('btn-about')?.addEventListener('click', () => {
            alert('Hotel Room Plan Manager v1.0\nDeveloped for efficient hotel room management and reservation scheduling.');
            this.updateStatus('About dialog opened');
        });

        document.getElementById('btn-help')?.addEventListener('click', () => {
            alert('Help:\n\n1. Use ribbon tabs to access different features\n2. Add rooms and reservations using respective buttons\n3. Navigate through dates using navigation buttons\n4. Drag and drop reservations to change dates or rooms\n5. Use view options to control what is displayed');
            this.updateStatus('Help dialog opened');
        });
    }

    // Modal Functions
    setupModals() {
        // Close modal on close button
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Form submissions
        document.getElementById('form-add-reservation')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                guestName: document.getElementById('guest-name').value,
                roomId: document.getElementById('room-select').value,
                checkinDate: document.getElementById('checkin-date').value,
                checkoutDate: document.getElementById('checkout-date').value,
                ratePerNight: parseFloat(document.getElementById('rate-per-night').value)
            };
            this.broadcastEvent('addReservation', data);
            this.closeModal('modal-add-reservation');
            e.target.reset();
            this.updateStatus('Reservation added successfully');
        });

        document.getElementById('form-add-accommodation')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                roomNumber: document.getElementById('room-number').value,
                floor: parseInt(document.getElementById('room-floor').value),
                roomType: document.getElementById('room-type').value,
                capacity: parseInt(document.getElementById('room-capacity').value),
                basePrice: parseFloat(document.getElementById('room-price').value)
            };
            this.broadcastEvent('addAccommodation', data);
            this.closeModal('modal-add-accommodation');
            e.target.reset();
            this.updateStatus('Room added successfully');
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    populateRoomSelect() {
        // This will be called by the plan component to populate rooms
        this.broadcastEvent('requestRoomList');
    }

    // Event Broadcasting System
    setupMessageBroadcasting() {
        window.addEventListener('message', (e) => {
            if (e.data.source === 'hotelPlan') {
                this.handlePlanMessage(e.data);
            }
        });
    }

    handlePlanMessage(data) {
        if (data.type === 'roomList') {
            this.updateRoomSelect(data.rooms);
        } else if (data.type === 'stats') {
            this.updateStats(data.stats);
        }
    }

    updateRoomSelect(rooms) {
        const select = document.getElementById('room-select');
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select a room...</option>';
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `Room ${room.number} (${room.type}) - ${room.status}`;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    }

    updateStats(stats) {
        const statsElement = document.getElementById('status-stats');
        if (statsElement) {
            statsElement.textContent = `Occupancy: ${stats.occupancy}% | Rooms: ${stats.totalRooms} | Available: ${stats.available}`;
        }
    }

    broadcastEvent(eventType, data = {}) {
        const event = new CustomEvent('ribbonEvent', {
            detail: {
                type: eventType,
                data: data,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);

        // Also try to send to iframe if plan is in iframe
        if (window.parent !== window) {
            window.parent.postMessage({
                source: 'ribbon',
                type: eventType,
                data: data
            }, '*');
        }
    }

    // Status Bar Updates
    updateStatus(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
            setTimeout(() => {
                statusElement.textContent = 'Ready';
            }, 3000);
        }
    }

    updateStatusBar() {
        const dateElement = document.getElementById('status-date');
        if (dateElement) {
            const today = new Date();
            dateElement.textContent = today.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Update stats (placeholder)
        const statsElement = document.getElementById('status-stats');
        if (statsElement) {
            statsElement.textContent = 'Occupancy: 0% | Rooms: 0 | Available: 0';
        }
    }

    // Public method to update rooms in select
    setRooms(rooms) {
        this.updateRoomSelect(rooms);
    }

    // Public method to update statistics
    setStats(stats) {
        this.updateStats(stats);
    }
}

// Initialize ribbon menu on page load
document.addEventListener('DOMContentLoaded', () => {
    window.ribbonMenuController = new RibbonMenuController();

    // Make global functions for modal closing
    window.closeModal = function(modalId) {
        window.ribbonMenuController.closeModal(modalId);
    };

    // Simulate receiving initial data
    setTimeout(() => {
        window.ribbonMenuController.setRooms([
            { id: 1, number: '101', type: 'Single', status: 'Available' },
            { id: 2, number: '102', type: 'Double', status: 'Occupied' },
            { id: 3, number: '103', type: 'Suite', status: 'Available' }
        ]);
        window.ribbonMenuController.setStats({ occupancy: 33, totalRooms: 3, available: 2 });
    }, 500);
});

// Expose methods to external scripts
window.RibbonMenuController = RibbonMenuController;

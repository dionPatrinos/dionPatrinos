// Hotel Room Plan - Floor Layout
class HotelRoomPlan {
    constructor() {
        // State
        this.currentDate = new Date();
        this.displayDays = 7; // Show 7 days at a time
        this.zoomLevel = 1;
        this.rooms = [];
        this.reservations = [];
        this.selectedRoom = null;
        this.draggedReservation = null;
        this.dragStartDate = null;

        // Filter states
        this.filterOccupied = true;
        this.filterAvailable = true;
        this.filterMaintenance = true;
        this.groupBy = 'none';

        // Sample data
        this.initializeSampleData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.setupRibbonCommunication();
    }

    initializeSampleData() {
        // Sample rooms
        this.rooms = [
            { id: 1, number: '101', floor: 1, type: 'Single', capacity: 1, basePrice: 100, status: 'available' },
            { id: 2, number: '102', floor: 1, type: 'Double', capacity: 2, basePrice: 150, status: 'occupied' },
            { id: 3, number: '103', floor: 1, type: 'Suite', capacity: 4, basePrice: 250, status: 'available' },
            { id: 4, number: '201', floor: 2, type: 'Single', capacity: 1, basePrice: 100, status: 'available' },
            { id: 5, number: '202', floor: 2, type: 'Double', capacity: 2, basePrice: 150, status: 'maintenance' },
            { id: 6, number: '203', floor: 2, type: 'Suite', capacity: 4, basePrice: 250, status: 'available' },
            { id: 7, number: '301', floor: 3, type: 'Single', capacity: 1, basePrice: 110, status: 'available' },
            { id: 8, number: '302', floor: 3, type: 'Double', capacity: 2, basePrice: 160, status: 'occupied' },
            { id: 9, number: '303', floor: 3, type: 'Suite', capacity: 4, basePrice: 260, status: 'available' },
        ];

        // Sample reservations
        this.reservations = [
            {
                id: 1,
                roomId: 2,
                guestName: 'John Doe',
                checkin: this.addDays(new Date(), 0),
                checkout: this.addDays(new Date(), 3),
                ratePerNight: 150,
                status: 'confirmed'
            },
            {
                id: 2,
                roomId: 8,
                guestName: 'Jane Smith',
                checkin: this.addDays(new Date(), 1),
                checkout: this.addDays(new Date(), 5),
                ratePerNight: 160,
                status: 'confirmed'
            },
            {
                id: 3,
                roomId: 1,
                guestName: 'Bob Wilson',
                checkin: this.addDays(new Date(), 2),
                checkout: this.addDays(new Date(), 4),
                ratePerNight: 100,
                status: 'pending'
            }
        ];
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('scroll-left')?.addEventListener('click', () => this.previousWeek());
        document.getElementById('scroll-right')?.addEventListener('click', () => this.nextWeek());

        // Rooms sidebar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.room-item')) {
                this.selectRoom(e.target.closest('.room-item').dataset.roomId);
            }
        });

        // Drag and drop
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));

        // Context menu
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Ribbon events
        window.addEventListener('ribbonEvent', (e) => this.handleRibbonEvent(e));
        window.addEventListener('message', (e) => this.handleWindowMessage(e));

        // Modal
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal')?.classList.remove('active');
            });
        });

        // Close modal on background click
        document.getElementById('modal-details')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-details') {
                e.target.classList.remove('active');
            }
        });
    }

    // Date Navigation
    addDays(date, days) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    getDateRange() {
        const start = new Date(this.currentDate);
        const end = new Date(this.currentDate);
        end.setDate(end.getDate() + this.displayDays - 1);
        return { start, end };
    }

    previousWeek() {
        this.currentDate = this.addDays(this.currentDate, -7);
        this.render();
    }

    nextWeek() {
        this.currentDate = this.addDays(this.currentDate, 7);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    // Zoom Functions
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.2, 2);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
        this.updateZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }

    updateZoom() {
        const grid = document.getElementById('calendar-grid');
        if (grid) {
            grid.style.transform = `scale(${this.zoomLevel})`;
            grid.style.transformOrigin = 'top left';
        }
    }

    // Rendering
    render() {
        this.renderDateHeader();
        this.renderRoomsList();
        this.renderCalendarGrid();
    }

    renderDateHeader() {
        const { start, end } = this.getDateRange();
        const rangeText = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        const element = document.getElementById('date-range');
        if (element) {
            element.textContent = rangeText;
        }
    }

    renderRoomsList() {
        const container = document.getElementById('rooms-list');
        if (!container) return;

        container.innerHTML = '';

        // Group rooms if needed
        let groupedRooms = this.groupRooms();

        groupedRooms.forEach(room => {
            if (!this.shouldShowRoom(room)) return;

            const roomElement = document.createElement('div');
            roomElement.className = 'room-item' + (this.selectedRoom === room.id ? ' selected' : '');
            roomElement.dataset.roomId = room.id;
            roomElement.innerHTML = `
                <span class="room-number">${room.number}</span>
                <span class="room-type">${room.type}</span>
                <span class="room-status ${room.status}">${room.status}</span>
            `;
            container.appendChild(roomElement);
        });
    }

    groupRooms() {
        if (this.groupBy === 'floor') {
            return this.rooms.sort((a, b) => a.floor - b.floor || a.number.localeCompare(b.number));
        } else if (this.groupBy === 'type') {
            return this.rooms.sort((a, b) => a.type.localeCompare(b.type) || a.number.localeCompare(b.number));
        } else if (this.groupBy === 'status') {
            return this.rooms.sort((a, b) => a.status.localeCompare(b.status) || a.number.localeCompare(b.number));
        }
        return this.rooms;
    }

    shouldShowRoom(room) {
        if (room.status === 'occupied' && !this.filterOccupied) return false;
        if (room.status === 'available' && !this.filterAvailable) return false;
        if (room.status === 'maintenance' && !this.filterMaintenance) return false;
        return true;
    }

    renderCalendarGrid() {
        const container = document.getElementById('calendar-grid');
        if (!container) return;

        const { start, end } = this.getDateRange();
        const days = [];

        for (let i = 0; i < this.displayDays; i++) {
            days.push(this.addDays(start, i));
        }

        // Build grid structure
        container.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
        container.innerHTML = '';

        // Create date headers
        days.forEach(day => {
            const dateCol = document.createElement('div');
            dateCol.className = 'date-column';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header-cell';
            dateHeader.innerHTML = `
                <div class="date-day">${day.getDate()}</div>
                <div class="date-weekday">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="date-text">${day.toLocaleDateString('en-US', { month: 'short' })}</div>
            `;

            const content = document.createElement('div');
            content.className = 'date-column-content';

            // Add rooms as rows
            this.groupRooms().forEach(room => {
                if (!this.shouldShowRoom(room)) return;

                const slot = document.createElement('div');
                slot.className = 'reservation-slot';
                slot.dataset.roomId = room.id;
                slot.dataset.date = day.toISOString().split('T')[0];
                slot.ondrop = (e) => this.handleDrop(e);
                slot.ondragover = (e) => this.handleDragOver(e);

                // Find reservations for this room and date
                const reservation = this.getReservationForRoomAndDate(room.id, day);
                if (reservation) {
                    const block = this.createReservationBlock(reservation, day);
                    slot.appendChild(block);
                }

                content.appendChild(slot);
            });

            dateCol.appendChild(dateHeader);
            dateCol.appendChild(content);
            container.appendChild(dateCol);
        });
    }

    getReservationForRoomAndDate(roomId, date) {
        return this.reservations.find(res => {
            return res.roomId === parseInt(roomId) &&
                   date >= res.checkin &&
                   date < res.checkout;
        });
    }

    createReservationBlock(reservation, date) {
        const room = this.rooms.find(r => r.id === reservation.roomId);
        const block = document.createElement('div');
        block.className = `reservation-block ${reservation.status}`;
        block.draggable = true;
        block.dataset.reservationId = reservation.id;
        block.dataset.roomId = reservation.roomId;
        block.dataset.date = date.toISOString().split('T')[0];

        // Check if this is the first day of the reservation
        const isFirstDay = this.daysApart(reservation.checkin, date) === 0;
        const isLastDay = this.daysApart(date, reservation.checkout) === 1;

        block.innerHTML = `
            <div class="reservation-guest">${reservation.guestName}</div>
            <div class="reservation-dates">${isFirstDay ? `Check-in` : ''} ${isLastDay ? `Check-out` : ''}</div>
        `;

        block.addEventListener('click', () => this.showReservationDetails(reservation));
        block.addEventListener('contextmenu', (e) => this.handleContextMenu(e, reservation));

        return block;
    }

    daysApart(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    // Drag and Drop
    handleDragStart(e) {
        if (!e.target.classList.contains('reservation-block')) return;

        this.draggedReservation = {
            id: parseInt(e.target.dataset.reservationId),
            roomId: parseInt(e.target.dataset.roomId),
            date: e.target.dataset.date
        };

        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragOver(e) {
        if (e.target.closest('.reservation-slot')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            e.target.closest('.reservation-slot')?.classList.add('dragging-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();

        const slot = e.target.closest('.reservation-slot');
        if (!slot || !this.draggedReservation) return;

        const newRoomId = parseInt(slot.dataset.roomId);
        const newDate = new Date(slot.dataset.date);

        const reservation = this.reservations.find(r => r.id === this.draggedReservation.id);
        if (reservation) {
            const daysDifference = this.daysApart(new Date(this.draggedReservation.date), newDate);

            reservation.checkin = this.addDays(reservation.checkin, daysDifference);
            reservation.checkout = this.addDays(reservation.checkout, daysDifference);
            reservation.roomId = newRoomId;

            this.render();
            this.updateRibbonStats();
        }

        document.querySelectorAll('.reservation-slot').forEach(s => s.classList.remove('dragging-over'));
    }

    handleDragEnd(e) {
        if (e.target.classList.contains('reservation-block')) {
            e.target.classList.remove('dragging');
        }
        document.querySelectorAll('.reservation-slot').forEach(s => s.classList.remove('dragging-over'));
        this.draggedReservation = null;
    }

    // Context Menu
    handleContextMenu(e, reservation) {
        e.preventDefault();

        if (!reservation && !e.target.classList.contains('reservation-block')) return;

        if (!reservation) {
            reservation = this.reservations.find(r => r.id === parseInt(e.target.dataset.reservationId));
        }

        const menu = document.getElementById('context-menu');
        if (!menu) return;

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.add('active');

        menu.dataset.currentReservation = reservation?.id || '';

        document.getElementById('ctx-view-details')?.addEventListener('click', () => {
            this.showReservationDetails(reservation);
            this.hideContextMenu();
        }, { once: true });

        document.getElementById('ctx-delete-reservation')?.addEventListener('click', () => {
            this.deleteReservation(reservation.id);
            this.hideContextMenu();
        }, { once: true });
    }

    hideContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.classList.remove('active');
        }
    }

    // Selection
    selectRoom(roomId) {
        this.selectedRoom = this.selectedRoom === parseInt(roomId) ? null : parseInt(roomId);
        this.renderRoomsList();
    }

    // Reservation Details
    showReservationDetails(reservation) {
        const room = this.rooms.find(r => r.id === reservation.roomId);
        const modal = document.getElementById('modal-details');
        const content = document.getElementById('details-content');

        if (!modal || !content) return;

        const nights = this.daysApart(reservation.checkin, reservation.checkout);
        const total = reservation.ratePerNight * nights;

        content.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Guest Name:</span>
                <span class="detail-value">${reservation.guestName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Room:</span>
                <span class="detail-value">${room.number} (${room.type})</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span class="detail-value">${reservation.checkin.toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span class="detail-value">${reservation.checkout.toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Nights:</span>
                <span class="detail-value">${nights}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Rate per Night:</span>
                <span class="detail-value">$${reservation.ratePerNight.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total:</span>
                <span class="detail-value" style="font-weight: 600;">$${total.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${reservation.status}</span>
            </div>
        `;

        modal.classList.add('active');
    }

    deleteReservation(reservationId) {
        this.reservations = this.reservations.filter(r => r.id !== reservationId);
        this.render();
        this.updateRibbonStats();
    }

    // Ribbon Communication
    setupRibbonCommunication() {
        this.updateRibbonStats();
        this.sendRoomListToRibbon();
    }

    updateRibbonStats() {
        const totalRooms = this.rooms.length;
        const occupiedRooms = this.rooms.filter(r => r.status === 'occupied').length;
        const availableRooms = this.rooms.filter(r => r.status === 'available').length;
        const occupancy = Math.round((occupiedRooms / totalRooms) * 100);

        const stats = {
            occupancy: occupancy,
            totalRooms: totalRooms,
            available: availableRooms,
            occupied: occupiedRooms
        };

        // Send to ribbon menu if available
        if (window.parent !== window) {
            window.parent.postMessage({
                source: 'hotelPlan',
                type: 'stats',
                stats: stats
            }, '*');
        }
    }

    sendRoomListToRibbon() {
        const rooms = this.rooms.map(r => ({
            id: r.id,
            number: r.number,
            type: r.type,
            status: r.status
        }));

        if (window.parent !== window) {
            window.parent.postMessage({
                source: 'hotelPlan',
                type: 'roomList',
                rooms: rooms
            }, '*');
        }
    }

    // Handle Ribbon Events
    handleRibbonEvent(e) {
        const { type, data } = e.detail;

        switch (type) {
            case 'addReservation':
                this.addReservation(data);
                break;
            case 'addAccommodation':
                this.addAccommodation(data);
                break;
            case 'deleteReservation':
                // Delete selected - implementation needed
                break;
            case 'deleteAccommodation':
                // Delete selected - implementation needed
                break;
            case 'navigateToToday':
                this.goToToday();
                break;
            case 'previousWeek':
                this.previousWeek();
                break;
            case 'nextWeek':
                this.nextWeek();
                break;
            case 'zoomIn':
                this.zoomIn();
                break;
            case 'zoomOut':
                this.zoomOut();
                break;
            case 'resetZoom':
                this.resetZoom();
                break;
            case 'toggleOccupied':
                this.filterOccupied = data.show;
                this.render();
                break;
            case 'toggleAvailable':
                this.filterAvailable = data.show;
                this.render();
                break;
            case 'toggleMaintenance':
                this.filterMaintenance = data.show;
                this.render();
                break;
            case 'groupByChanged':
                this.groupBy = data.groupBy;
                this.render();
                break;
        }
    }

    handleWindowMessage(e) {
        if (e.data.source === 'ribbon') {
            this.handleRibbonEvent({
                detail: {
                    type: e.data.type,
                    data: e.data.data
                }
            });
        }
    }

    addReservation(data) {
        const newReservation = {
            id: Math.max(...this.reservations.map(r => r.id), 0) + 1,
            roomId: parseInt(data.roomId),
            guestName: data.guestName,
            checkin: new Date(data.checkinDate),
            checkout: new Date(data.checkoutDate),
            ratePerNight: data.ratePerNight,
            status: 'confirmed'
        };

        this.reservations.push(newReservation);
        this.render();
        this.updateRibbonStats();
    }

    addAccommodation(data) {
        const newRoom = {
            id: Math.max(...this.rooms.map(r => r.id), 0) + 1,
            number: data.roomNumber,
            floor: data.floor,
            type: data.roomType,
            capacity: data.capacity,
            basePrice: data.basePrice,
            status: 'available'
        };

        this.rooms.push(newRoom);
        this.render();
        this.sendRoomListToRibbon();
        this.updateRibbonStats();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.hotelRoomPlan = new HotelRoomPlan();
});

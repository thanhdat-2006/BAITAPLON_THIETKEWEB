document.addEventListener('DOMContentLoaded', () => {
    console.log("Booking.js đã được tải!"); // Kiểm tra xem file có chạy không

    const modal = document.getElementById('booking-modal');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('booking-form');
    const tourNameDisplay = document.getElementById('selected-tour-name');
    let currentTourName = "";

    // Kiểm tra xem Modal có tồn tại trong HTML không
    if (!modal) {
        console.error("Lỗi: Không tìm thấy phần tử #booking-modal trong HTML.");
        return;
    }

    // 1. Xử lý sự kiện CLICK (Dùng closest để bắt dính nút chuẩn hơn)
    document.body.addEventListener('click', (e) => {
        // Tìm xem cái thứ vừa bấm vào có phải là nút .btn-book (hoặc con của nó) không
        const btn = e.target.closest('.btn-book');

        if (btn) {
            console.log("Đã bấm nút đặt tour!"); // Báo hiệu đã bấm trúng
            
            // Lấy thông tin từ thẻ cha (tour-card)
            const tourCard = btn.closest('.tour-card');
            if (tourCard) {
                currentTourName = tourCard.querySelector('h4').innerText;
                const currentPrice = tourCard.querySelector('.tour-price').innerText;
                
                // Điền thông tin vào form modal
                tourNameDisplay.innerText = `Tour: ${currentTourName} - Giá: ${currentPrice}`;
                
                // Hiện Modal
                modal.style.display = 'flex';
            }
        }
    });

    // 2. Đóng Modal khi bấm dấu X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 3. Đóng Modal khi bấm ra ngoài vùng trắng
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 4. Xử lý Form Submit
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Lấy dữ liệu
            const bookingData = {
                id: Date.now(),
                tour: currentTourName,
                name: document.getElementById('cus-name').value,
                phone: document.getElementById('cus-phone').value,
                email: document.getElementById('cus-email').value,
                date: document.getElementById('start-date').value,
                people: document.getElementById('cus-people').value,
                status: "Chờ xác nhận"
            };

            // Lưu LocalStorage
            let bookings = localStorage.getItem('bookings');
            bookings = bookings ? JSON.parse(bookings) : [];
            bookings.push(bookingData);
            localStorage.setItem('bookings', JSON.stringify(bookings));

            alert('Đặt tour thành công! Bạn có thể xem lại trong trang Lịch sử.');
            modal.style.display = 'none';
            form.reset();
        });
    }
});
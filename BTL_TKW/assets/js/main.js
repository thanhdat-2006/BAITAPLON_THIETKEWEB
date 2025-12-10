document.addEventListener('DOMContentLoaded', () => {
    initFooterDatetime();
    // --- PHẦN 1: ĐIỀU HƯỚNG (ROUTING) ---
    // Kiểm tra xem đang ở trang nào dựa trên ID của vùng chứa nội dung
    const regionContainer = document.getElementById('region-container'); // Trang chủ
    const placesContainer = document.getElementById('places-container'); // Trang Điểm đến
    const detailContainer = document.getElementById('detail-container'); // Trang Chi tiết Điểm đến
    const toursContainer = document.getElementById('tours-container');   // Trang Tour
    const tourDetailContainer = document.getElementById('tour-detail-container'); // Trang Chi tiết Tour
    const hotelsContainer = document.getElementById('hotels-container'); // Trang Hotels
    const hotelDetailContainer = document.getElementById('hotel-detail-container'); // Trang Chi tiết Hotel
    const resultsContainer = document.getElementById('results-container'); // Trang Tìm kiếm
    const historyList = document.getElementById('history-list');         // Trang Lịch sử
    const contactForm = document.getElementById('contact-form');         // Trang Liên hệ

    // Gọi hàm tương ứng với từng trang
    if (regionContainer) loadHomePage();
    if (placesContainer) loadDestinationsPage();
    if (detailContainer) loadDestinationDetail();
    if (toursContainer) loadToursPage();
    if (tourDetailContainer) loadTourDetail();
    if (hotelsContainer) loadHotelsPage();
    if (hotelDetailContainer) loadHotelDetail();
    if (resultsContainer) loadSearchPage();
    if (historyList) loadHistoryPage();
    if (contactForm) setupContactForm();

    // Luôn kích hoạt chức năng Modal đặt tour
    setupBookingModal();
    setupHotelModal();
    // Responsive navigation toggle (mobile)
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = document.body.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu when clicking a nav link
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => document.body.classList.remove('nav-open'));
        });

        // Click outside nav closes it
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav') && !e.target.closest('#nav-toggle') && document.body.classList.contains('nav-open')) {
                document.body.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
});

function initFooterDatetime() {
    const el = document.getElementById('footer-datetime');
    if (!el) return;
    function update() {
        const now = new Date();
        const date = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const time = now.toLocaleTimeString('vi-VN');
        el.textContent = `${date} — ${time}`;
    }
    update();
    setInterval(update, 1000);
}

// ======================================================
// 1. LOGIC TRANG CHỦ (Load 3 miền)
// ======================================================
async function loadHomePage() {
    try {
        const response = await fetch('assets/data/destination.json');
        const data = await response.json();
        const container = document.getElementById('region-container');
        
        container.innerHTML = '';
        data.regions.forEach(region => {
            container.innerHTML += `
                <div class="region-card">
                    <img src="${region.image}" alt="${region.name}">
                    <div class="region-info">
                        <h4>${region.name}</h4>
                        <p>${region.description}</p>
                        <a href="${region.link}">Xem chi tiết &rarr;</a>
                    </div>
                </div>`;
        });
    } catch (err) {
        console.error("Lỗi tải trang chủ:", err);
    }
}

// ======================================================
// 2. LOGIC TRANG ĐIỂM ĐẾN (Load danh sách & Bộ lọc)
// ======================================================
async function loadDestinationsPage() {
    try {
        const response = await fetch('assets/data/destination.json');
        const data = await response.json();
        const container = document.getElementById('places-container');

        // Kiểm tra URL xem có yêu cầu lọc miền không (vd: destinations.html?region=north)
        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        
        let displayPlaces = data.places;
        
        // Nếu có tham số trên URL, lọc dữ liệu ngay
        if (regionParam) {
            displayPlaces = data.places.filter(p => p.region === regionParam);
            // Highlight nút bấm tương ứng
            const activeBtn = document.querySelector(`.filter-btn[data-filter="${regionParam}"]`);
            if (activeBtn) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                activeBtn.classList.add('active');
            }
        }

        renderPlaces(displayPlaces, container);
        setupFilters(data.places, container);

    } catch (err) {
        console.error("Lỗi tải điểm đến:", err);
    }
}

// Hàm vẽ danh sách địa điểm (Đã cập nhật thẻ <a> dẫn tới trang chi tiết)
function renderPlaces(places, container) {
    container.innerHTML = '';
    if(places.length === 0) {
        container.innerHTML = '<p style="width:100%; text-align:center;">Không tìm thấy địa điểm nào.</p>';
        return;
    }
    places.forEach(place => {
        // Nếu dữ liệu JSON chưa có id, dùng tạm name làm id (fallback)
        const linkId = place.id || 'hanoi'; 
        
        // Thay vì thẻ div, ta dùng thẻ a để bấm vào chuyển trang
        container.innerHTML += `
            <a href="destination-detail.html?id=${linkId}" class="dest-card">
                <img src="${place.img}" alt="${place.name}">
                <div class="dest-info">
                    <h4>${place.name}</h4>
                    <p>${place.desc}</p>
                </div>
            </a>`;
    });
}

function setupFilters(allPlaces, container) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const filtered = filter === 'all' ? allPlaces : allPlaces.filter(p => p.region === filter);
            renderPlaces(filtered, container);
        });
    });
}

// ======================================================
// 3. LOGIC TRANG CHI TIẾT ĐỊA ĐIỂM (MỚI HOÀN TOÀN)
// ======================================================
async function loadDestinationDetail() {
    try {
        // 1. Lấy ID từ trên thanh địa chỉ (URL)
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            document.getElementById('detail-container').innerHTML = '<p style="text-align:center; margin-top:50px">Không tìm thấy địa điểm.</p>';
            return;
        }

        // 2. Tải dữ liệu JSON
        const response = await fetch('assets/data/destination.json');
        const data = await response.json();
        
        // 3. Tìm địa điểm tương ứng với ID
        const place = data.places.find(p => p.id === id);

        if (!place) {
            document.getElementById('detail-container').innerHTML = '<p style="text-align:center; margin-top:50px">Địa điểm không tồn tại hoặc ID sai.</p>';
            return;
        }

        // 4. Hiển thị thông tin chi tiết ra màn hình
        const container = document.getElementById('detail-container');
        
        // Kiểm tra xem có dữ liệu chi tiết không, nếu không thì hiện 'Đang cập nhật'
        const details = place.details || {};
        const intro = details.intro || 'Thông tin đang cập nhật...';
        const visit = details.visit || 'Đang cập nhật...';
        const food = details.food || 'Đang cập nhật...';
        const culture = details.culture || 'Đang cập nhật...';

        container.innerHTML = `
            <div class="detail-header" style="background: url('${place.img}') no-repeat center center/cover;">
                <div class="container header-content">
                    <h1>${place.name}</h1>
                    <p style="font-size: 1.2rem; color: #fff;">${place.desc}</p>
                </div>
            </div>

            <div class="container detail-grid">
                <div class="main-content">
                    <div class="detail-box">
                        <h3><i class="fas fa-info-circle"></i> Giới Thiệu</h3>
                        <p>${intro}</p>
                    </div>

                    <div class="detail-box">
                        <h3><i class="fas fa-camera-retro"></i> Địa Điểm Tham Quan</h3>
                        <p>${visit}</p>
                    </div>

                    <div class="detail-box">
                        <h3><i class="fas fa-utensils"></i> Ẩm Thực Đặc Sắc</h3>
                        <p>${food}</p>
                    </div>
                </div>

                <div class="sidebar">
                    <div class="detail-box">
                        <h3><i class="fas fa-theater-masks"></i> Văn Hóa</h3>
                        <p>${culture}</p>
                    </div>
                    <div class="sidebar-img">
                         <img src="${place.img}" alt="${place.name}" style="border-radius:10px; margin-bottom:20px;">
                    </div>
                    <a href="tours.html" class="btn-primary" style="display:block; text-align:center; width:100%">Tìm Tour Đến Đây</a>
                </div>
            </div>
        `;

    } catch (err) {
        console.error("Lỗi tải chi tiết:", err);
    }
}

// ======================================================
// 4. LOGIC TRANG TOURS (Load danh sách Tour - Giao diện mới)
// ======================================================
async function loadToursPage() {
    try {
        const response = await fetch('assets/data/tours.json');
        const tours = await response.json();
        const container = document.getElementById('tours-container');
        
        container.innerHTML = '';
        tours.forEach(tour => {
            // Cấu trúc HTML mới cho thẻ Tour: Ảnh -> Tiêu đề -> Footer (Thời gian + Giá)
            // Đã loại bỏ nút đặt tour
            container.innerHTML += `
                <div class="tour-card" onclick="window.location.href='tour-detail.html?id=${tour.id}'">
                    <div class="tour-img-wrapper">
                        <img src="${tour.image}" alt="${tour.name}" loading="lazy">
                    </div>
                    
                    <div class="tour-content">
                        <h3 class="tour-title">
                            <a href="tour-detail.html?id=${tour.id}">${tour.name}</a>
                        </h3>

                        <div class="tour-footer">
                            <div class="tour-time">
                                <i class="far fa-clock"></i> ${tour.time}
                            </div>
                            <div class="tour-price">
                                ${tour.price}
                            </div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (err) {
        console.error("Lỗi tải tour:", err);
        const container = document.getElementById('tours-container');
        if(container) container.innerHTML = '<p style="text-align:center">Đã xảy ra lỗi hoặc chưa có dữ liệu tour.</p>';
    }
}

// ======================================================
// 5. CHỨC NĂNG ĐẶT TOUR (MODAL POPUP - Xử lý chung)
// ======================================================
function setupBookingModal() {
    const modal = document.getElementById('booking-modal');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('booking-form');
    const tourNameDisplay = document.getElementById('selected-tour-name');
    let currentTourName = "";

    if (!modal) return; // Nếu trang hiện tại không có modal thì thoát

    // A. BẮT SỰ KIỆN CLICK (Dùng Event Delegation)
    document.addEventListener('click', (e) => {
        // Lưu ý: Trong giao diện mới, nút .btn-book đã bị xóa khỏi trang danh sách.
        // Hàm này vẫn sẽ hoạt động tốt cho trang Tìm kiếm (nếu còn nút) hoặc các trang khác.
        if (e.target && e.target.classList.contains('btn-book')) {
            // Tìm thẻ cha chứa thông tin tour (để lấy tên và giá)
            const card = e.target.closest('.tour-card') || e.target.closest('.result-card');
            if (card) {
                // Xử lý lấy tên tùy theo loại thẻ (tour-card hoặc result-card)
                const titleEl = card.querySelector('.tour-title') || card.querySelector('.result-card-title');
                const priceEl = card.querySelector('.tour-price') || card.querySelector('.result-card-price');
                
                if (titleEl) currentTourName = titleEl.innerText;
                const price = priceEl ? priceEl.innerText : '';
                
                // Điền thông tin vào Modal
                tourNameDisplay.innerText = `Tour: ${currentTourName} - Giá: ${price}`;
                modal.style.display = 'flex'; // Hiện modal
            }
        }
    });

    // B. Đóng Modal khi bấm X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // C. Đóng Modal khi bấm ra ngoài vùng trắng
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // D. Xử lý khi nhấn nút "Xác Nhận" (Submit Form)
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Chặn việc load lại trang

            // Gom dữ liệu từ form
            const bookingInfo = {
                id: '#' + Math.floor(Math.random() * 10000),
                tourName: String(currentTourName || document.getElementById('selected-tour-name').getAttribute('data-tour-name') || 'Tour tự chọn'),
                name: document.getElementById('cus-name').value,
                phone: document.getElementById('cus-phone').value,
                email: document.getElementById('cus-email').value,
                startDate: document.getElementById('start-date').value,
                people: document.getElementById('cus-people').value,
                status: 'Chờ xác nhận',
                bookingDate: new Date().toISOString()
            };

            // Lưu vào LocalStorage
            let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            bookings.push(bookingInfo);
            localStorage.setItem('bookings', JSON.stringify(bookings));

            alert("Đặt tour thành công! Bạn có thể xem lại trong trang Lịch sử.");
            modal.style.display = 'none';
            form.reset();
        });
    }
}

// ======================================================
// 6. LOGIC TRANG LỊCH SỬ (Load từ LocalStorage)
// ======================================================


// ======================================================
// 7. LOGIC TRANG LIÊN HỆ
// ======================================================
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            alert(`Cảm ơn ${name}! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi sớm.`);
            form.reset();
        });
    }
}

// ======================================================
// 8. LOGIC TRANG CHI TIẾT TOUR (MỚI)
// ======================================================
let globalToursData = []; // Biến lưu trữ dữ liệu để dùng chung

async function loadTourDetail() {
  try {
    // 1. Tải dữ liệu JSON
    const response = await fetch("assets/data/tours.json");
    globalToursData = await response.json();

    // 2. Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get("id");

    // Nếu không có ID hoặc ID sai, mặc định lấy tour đầu tiên
    let currentTour = globalToursData.find((t) => t.id == id);
    if (!currentTour && globalToursData.length > 0) {
      currentTour = globalToursData[0];
      id = currentTour.id;
    }

    if (!currentTour) {
      document.querySelector(".col-left").innerHTML =
        "<p>Dữ liệu tour không tồn tại.</p>";
      return;
    }

    // 3. Render lần đầu
    renderTourMainContent(currentTour);
    renderSidebar(currentTour.id);
  } catch (err) {
    console.error("Lỗi tải chi tiết tour:", err);
  }
}

// Hàm hiển thị nội dung chính (Cột Trái)
function renderTourMainContent(tour) {
  // Cập nhật tên, giá, thời gian, phương tiện
  document.getElementById("detail-name").innerText = tour.name;
  document.getElementById("detail-price").innerText = tour.price;
  document.getElementById("detail-transport").innerText =
    tour.transport || "Xe du lịch đời mới";
  if (document.getElementById("detail-time")) {
    document.getElementById("detail-time").innerText =
      tour.time || "Đang cập nhật";
  }

  // Cập nhật Intro (hỗ trợ xuống dòng)
  const introEl = document.getElementById("detail-intro");
  introEl.innerHTML = tour.intro
    ? `<p>${tour.intro}</p>`
    : "<p>Thông tin đang cập nhật.</p>";

  // Cập nhật Lịch trình (Schedule)
  const scheduleContainer = document.getElementById("detail-schedule");
  scheduleContainer.innerHTML = "";

  if (tour.schedule && tour.schedule.length > 0) {
    tour.schedule.forEach((item) => {
      let activitiesHtml = "";
      if (item.activities && item.activities.length > 0) {
        activitiesHtml = `<ul class="activity-list">
                    ${item.activities.map((act) => `<li>${act}</li>`).join("")}
                </ul>`;
      }

      const dayHtml = `
                <div class="schedule-item">
                    <div class="day-header">
                        <span class="day-badge">${item.day}</span>
                        <span class="day-title">${item.title}</span>
                    </div>
                    <div class="day-body">
                        ${activitiesHtml}
                    </div>
                </div>
            `;
      scheduleContainer.innerHTML += dayHtml;
    });
  } else {
    scheduleContainer.innerHTML =
      "<p>Lịch trình chi tiết đang được cập nhật.</p>";
  }

  // Cập nhật dữ liệu cho Modal Đặt Tour (để khi bấm nút, modal hiện đúng tên tour này)
  const modalName = document.getElementById("selected-tour-name");
  if (modalName) {
    modalName.setAttribute("data-tour-name", tour.name);
    modalName.setAttribute("data-tour-price", tour.price);
  }
}

// Hàm hiển thị Sidebar (Cột Phải)
function renderSidebar(currentId) {
  const listContainer = document.getElementById("related-tours-list");
  listContainer.innerHTML = "";

  // Lọc bỏ tour đang xem, chỉ hiện các tour khác
  const otherTours = globalToursData.filter((t) => t.id != currentId);

  otherTours.forEach((tour) => {
    const item = document.createElement("div");
    item.className = "sidebar-tour-item";
    item.innerHTML = `
            <div class="sidebar-img">
                <img src="${tour.image}" alt="${tour.name}">
            </div>
            <div class="sidebar-info">
                <h5 class="sidebar-name">${tour.name}</h5>
                <p class="sidebar-price">${tour.price}</p>
            </div>
        `;

    // SỰ KIỆN CLICK: Đổi nội dung mà KHÔNG load lại trang
    item.addEventListener("click", () => {
      // 1. Render lại nội dung bên trái
      renderTourMainContent(tour);

      // 2. Render lại sidebar (để ẩn cái vừa chọn, hiện cái cũ lên)
      renderSidebar(tour.id);

      // 3. Cuộn lên đầu trang nhẹ nhàng
      window.scrollTo({ top: 0, behavior: "smooth" });

      // 4. Cập nhật URL trên trình duyệt (để user có thể copy link)
      const newUrl = `${window.location.pathname}?id=${tour.id}`;
      history.pushState(null, "", newUrl);
    });

    listContainer.appendChild(item);
  });
}

// Hàm mở Modal từ trang chi tiết
window.openBookingModal = function () {
  const modal = document.getElementById("booking-modal");
  const displayEl = document.getElementById("selected-tour-name");

  // Lấy thông tin từ giao diện hiện tại
  const currentName = document.getElementById("detail-name").innerText;
  const currentPrice = document.getElementById("detail-price").innerText;

  if (modal) {
    displayEl.innerText = `Tour: ${currentName} - Giá: ${currentPrice}`;
    modal.style.display = "flex";
  }
};

// ======================================================
// 9. LOGIC TRANG HOTELS (Load danh sách & Bộ lọc)
// ======================================================
async function loadHotelsPage() {
    try {
        const response = await fetch('assets/data/hotels.json');
        const hotels = await response.json();
        const container = document.getElementById('hotels-container');

        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        
        let displayHotels = hotels;
        
        if (regionParam) {
            displayHotels = hotels.filter(h => h.region === regionParam);
            const activeBtn = document.querySelector(`.filter-btn[data-filter="${regionParam}"]`);
            if (activeBtn) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                activeBtn.classList.add('active');
            }
        }

        renderHotels(displayHotels, container);
        setupHotelFilters(hotels, container);
        setupHotelSort(displayHotels, hotels, container);

    } catch (err) {
        console.error("Lỗi tải khách sạn:", err);
    }
}

function renderHotels(hotels, container) {
    // Defensive: if caller passed a superset, respect currently active filters
    const activeRegionBtn = document.querySelector('.filter-btn.active');
    const activeTypeBtn = document.querySelector('.type-btn.active');
    const activeRegion = activeRegionBtn ? activeRegionBtn.getAttribute('data-filter') : 'all';
    const activeType = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'all';

    let toRender = Array.isArray(hotels) ? hotels.slice() : [];
    if (activeRegion && activeRegion !== 'all') toRender = toRender.filter(h => h.region === activeRegion);
    if (activeType && activeType !== 'all') toRender = toRender.filter(h => (h.type || 'hotel') === activeType);

    container.innerHTML = '';
    if (hotels.length === 0) {
        container.innerHTML = '<p style="width:100%; text-align:center;">Không tìm thấy khách sạn nào.</p>';
        return;
    }
    toRender.forEach(hotel => {
        const typeLabel = hotel.type ? (hotel.type === 'restaurant' ? 'Nhà hàng' : (hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1))) : 'Khách sạn';
        container.innerHTML += `
            <div class="hotel-card" onclick="viewHotelDetail(${hotel.id})">
                <div class="hotel-card-image">
                    <img src="${hotel.image}" alt="${hotel.name}">
                    <div class="hotel-card-rating">⭐ ${hotel.rating}</div>
                </div>
                <div class="hotel-card-info">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <div class="hotel-card-name">${hotel.name}</div>
                        <div class="hotel-card-type" style="font-size:0.85rem; color:#fff; background:var(--primary-color); padding:6px 10px; border-radius:6px;">${typeLabel}</div>
                    </div>
                    <div class="hotel-card-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${hotel.location}
                    </div>
                    <div class="hotel-card-amenities">
                        ${hotel.amenities && hotel.amenities.slice ? hotel.amenities.slice(0, 2).map(a => `<span class="hotel-card-amenity">${a}</span>`).join('') : ''}
                    </div>
                    <div class="hotel-card-price">${hotel.price}</div>
                    <button class="hotel-card-button">Xem Chi Tiết</button>
                </div>
            </div>
        `;
    });
}

function setupHotelFilters(allHotels, container) {
    // Hỗ trợ lọc theo region (filter-btn) và theo type (type-btn).
    const regionButtons = document.querySelectorAll('.filter-btn');
    const typeButtons = document.querySelectorAll('.type-btn');

    function applyFilters() {
        const activeRegionBtn = document.querySelector('.filter-btn.active');
        const activeTypeBtn = document.querySelector('.type-btn.active');
        const region = activeRegionBtn ? activeRegionBtn.getAttribute('data-filter') : 'all';
        const type = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'all';

        let filtered = allHotels.slice();
        if (region && region !== 'all') filtered = filtered.filter(h => h.region === region);
        if (type && type !== 'all') filtered = filtered.filter(h => (h.type || 'hotel') === type);
        renderHotels(filtered, container);
    }

    regionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            regionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
}

function setupHotelSort(currentHotels, allHotels, container) {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortType = e.target.value;
            const getPriceValue = (item) => {
                if (!item) return 0;
                // If numeric value cached, use it
                if (item.priceNum && typeof item.priceNum === 'number') return item.priceNum;
                const raw = (item.price || '').toString();
                // Try to match the first number group (handles ranges like "150,000đ - 450,000đ")
                const m = raw.match(/(\d[\d.,]*)/);
                if (!m) return 0;
                // Remove thousand separators and dots, keep digits
                const normalized = m[1].replace(/[.,]/g, '');
                const n = parseInt(normalized, 10);
                return isNaN(n) ? 0 : n;
            };

            let sorted = [...currentHotels];
            if (sortType === 'price-asc') {
                sorted.sort((a, b) => getPriceValue(a) - getPriceValue(b));
            } else if (sortType === 'price-desc') {
                sorted.sort((a, b) => getPriceValue(b) - getPriceValue(a));
            } else if (sortType === 'rating') {
                sorted.sort((a, b) => b.rating - a.rating);
            }

            renderHotels(sorted, container);
        });
    }
}

window.viewHotelDetail = function(hotelId) {
    window.location.href = `hotel-detail.html?id=${hotelId}`;
};


// ======================================================
// 10. LOGIC TRANG CHI TIẾT HOTEL (ĐÃ CẬP NHẬT GỌI MODAL ĐẶT PHÒNG)
// ======================================================
async function loadHotelDetail() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            document.getElementById('hotel-detail-container').innerHTML = '<p style="text-align:center; margin-top:50px">Không tìm thấy khách sạn.</p>';
            return;
        }

        const response = await fetch('assets/data/hotels.json');
        const hotels = await response.json();
        const hotel = hotels.find(h => h.id === parseInt(id));

        if (!hotel) {
            document.getElementById('hotel-detail-container').innerHTML = '<p style="text-align:center; margin-top:50px">Khách sạn không tồn tại.</p>';
            return;
        }

        const container = document.getElementById('hotel-detail-container');
        const details = hotel.details || {};
        
        container.innerHTML = `
            <div class="detail-header" style="background: url('${hotel.image}') no-repeat center center/cover;">
                <div class="container header-content">
                    <h1>${hotel.name}</h1>
                    <p style="font-size: 1.2rem; color: #fff;">⭐ ${hotel.rating}/5</p>
                </div>
            </div>

            <div class="container" style="padding: 50px 0;">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
                    <div class="main-content">
                        <div class="detail-box">
                            <h3><i class="fas fa-info-circle"></i> Giới Thiệu</h3>
                            <p>${hotel.description}</p>
                        </div>

                        <div class="detail-box">
                            <h3><i class="fas fa-door-open"></i> Phòng & Dịch Vụ</h3>
                            <p><strong>Phòng:</strong> ${details.rooms || 'Đang cập nhật'}</p>
                            <p style="margin-top: 10px;"><strong>Tiện Nghi:</strong></p>
                            <p>${details.facilities || 'Đang cập nhật'}</p>
                        </div>

                        <div class="detail-box">
                            <h3><i class="fas fa-concierge-bell"></i> Dịch Vụ</h3>
                            <p>${details.service || 'Dịch vụ 24/7 hoàn toàn'}</p>
                        </div>
                    </div>

                    <div class="sidebar">
                        <div class="detail-box">
                            <h3><i class="fas fa-map-marker-alt"></i> Địa Chỉ</h3>
                            <p>${hotel.location}</p>
                        </div>

                        <div class="detail-box">
                            <h3><i class="fas fa-money-bill-alt"></i> Giá Phòng</h3>
                            <p style="font-size: 1.5rem; color: #e74c3c; font-weight: 700;">${hotel.price}</p>
                        </div>

                        <div class="detail-box">
                            <h3><i class="fas fa-star"></i> Tiện Nghi</h3>
                            ${hotel.amenities.map(a => `<p><i class="fas fa-check" style="color: var(--primary-color); margin-right: 8px;"></i>${a}</p>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 5. Gắn sự kiện cho nút "Đặt Phòng" sau khi HTML được render
        const bookBtn = document.getElementById('book-hotel-btn');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => {
                openHotelBookingModal(hotel.name, hotel.price);
            });
        }
    } catch (err) {
        console.error("Lỗi tải chi tiết khách sạn:", err);
    }
}

// ======================================================
// 11. LOGIC TRANG TÌM KIẾM
// ======================================================
async function loadSearchPage() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        
        if (query) {
            document.getElementById('search-query').innerText = `Kết quả tìm kiếm cho: "${query}"`;
            performSearch(query);
        }

        // Setup sự kiện tìm kiếm
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }
    } catch (err) {
        console.error("Lỗi trang tìm kiếm:", err);
    }
}

async function performSearch(query) {
    try {
        const toursResponse = await fetch('assets/data/tours.json');
        const tours = await toursResponse.json();

        const hotelsResponse = await fetch('assets/data/hotels.json');
        const hotels = await hotelsResponse.json();

        const queryLower = query.toLowerCase();
        
        const tourResults = tours.filter(t => t.name.toLowerCase().includes(queryLower));
        const hotelResults = hotels.filter(h => h.name.toLowerCase().includes(queryLower) || h.location.toLowerCase().includes(queryLower));

        const container = document.getElementById('results-container');
        let html = '';

        if (tourResults.length > 0) {
            html += '<h3 style="margin: 30px 0 20px; color: var(--primary-color);">🎫 Tours</h3>';
            tourResults.forEach(tour => {
                html += `
                    <div class="result-card">
                        <div class="result-card-image">
                            <img src="${tour.image}" alt="${tour.name}">
                            <span class="result-card-badge">Tour</span>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-title">${tour.name}</div>
                            <div class="result-card-meta">
                                <i class="far fa-clock"></i> ${tour.time}
                            </div>
                            <div class="result-card-price">${tour.price}</div>
                            <button class="result-card-button btn-book">Đặt Ngay</button>
                        </div>
                    </div>
                `;
            });
        }

        if (hotelResults.length > 0) {
            html += '<h3 style="margin: 30px 0 20px; color: var(--primary-color); grid-column: 1 / -1;">🏨 Khách Sạn</h3>';
            hotelResults.forEach(hotel => {
                html += `
                    <div class="result-card" onclick="viewHotelDetail(${hotel.id})">
                        <div class="result-card-image">
                            <img src="${hotel.image}" alt="${hotel.name}">
                            <span class="result-card-badge">Khách Sạn</span>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-title">${hotel.name}</div>
                            <div class="result-card-meta">
                                <i class="fas fa-map-marker-alt"></i> ${hotel.location}
                            </div>
                            <div class="result-card-meta">
                                <i class="fas fa-star"></i> ${hotel.rating}/5
                            </div>
                            <div class="result-card-price">${hotel.price}</div>
                            <button class="result-card-button">Xem Chi Tiết</button>
                        </div>
                    </div>
                `;
            });
        }

        if (tourResults.length === 0 && hotelResults.length === 0) {
            html = '<p style="text-align: center; width: 100%; padding: 40px 0; font-size: 1.1rem;">Không tìm thấy kết quả nào</p>';
        }

        container.innerHTML = html;

        // Gắn sự kiện cho các nút "Đặt Ngay"
        document.querySelectorAll('.btn-book').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.result-card');
                if (card && card.querySelector('.tour-price')) {
                    const tourName = card.querySelector('.result-card-title').innerText;
                    const tourPrice = card.querySelector('.tour-price').innerText;
                    document.getElementById('selected-tour-name').innerText = `Tour: ${tourName} - Giá: ${tourPrice}`;
                    document.getElementById('booking-modal').style.display = 'flex';
                }
            });
        });
    } catch (err) {
        console.error("Lỗi trong tìm kiếm:", err);
    }
}

// ======================================================
// 12. MODAL HOTEL (Mở chi tiết hotel trong modal)
// ======================================================
function setupHotelModal() {
    const modal = document.getElementById('hotel-modal');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;

    if (!modal) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// ======================================================
// HÀM MỞ/ĐÓNG MODAL ĐẶT PHÒNG KHÁCH SẠN
// ======================================================
window.openHotelBookingModal = function(name, price) {
    const modal = document.getElementById('booking-hotel-modal');
    const titleEl = document.getElementById('modal-title');
    const infoEl = document.getElementById('modal-hotel-info');
    const form = document.getElementById('hotel-booking-form');

    if (!modal) return;

    // Cập nhật thông tin trong modal
    titleEl.innerText = "Đặt Phòng Khách Sạn";
    infoEl.innerText = `${name} - Giá: ${price}/đêm`;
    form.dataset.hotelName = name; // Lưu tên khách sạn vào form để xử lý sau

    modal.style.display = 'flex';
};

window.closeHotelBookingModal = function() {
    const modal = document.getElementById('booking-hotel-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('booking-hotel-form').reset();
    }
};
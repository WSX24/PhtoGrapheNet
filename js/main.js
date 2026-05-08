// ===== Photography Data =====
// 替换为自己的图片路径即可
const photos = [
    // 风光
    { src: "https://picsum.photos/seed/landscape1/800/600", category: "landscape", title: "晨曦山峦" },
    { src: "https://picsum.photos/seed/landscape2/800/1000", category: "landscape", title: "静谧湖泊" },
    { src: "https://picsum.photos/seed/landscape3/800/600", category: "landscape", title: "落日海岸" },
    { src: "https://picsum.photos/seed/landscape4/800/800", category: "landscape", title: "川西秋色" },
    { src: "https://picsum.photos/seed/landscape5/800/600", category: "landscape", title: "云海日出" },
    { src: "https://picsum.photos/seed/landscape6/800/600", category: "landscape", title: "草原星空" },

    // 人像
    { src: "https://picsum.photos/seed/portrait1/800/1000", category: "portrait", title: "回眸" },
    { src: "https://picsum.photos/seed/portrait2/800/600", category: "portrait", title: "午后光影" },
    { src: "https://picsum.photos/seed/portrait3/800/1000", category: "portrait", title: "微笑" },
    { src: "https://picsum.photos/seed/portrait4/800/600", category: "portrait", title: "窗前" },

    // 街拍
    { src: "https://picsum.photos/seed/street1/800/600", category: "street", title: "雨夜霓虹" },
    { src: "https://picsum.photos/seed/street2/800/800", category: "street", title: "巷弄光影" },
    { src: "https://picsum.photos/seed/street3/800/600", category: "street", title: "城市剪影" },
    { src: "https://picsum.photos/seed/street4/800/600", category: "street", title: "匆匆" },

    // 静物
    { src: "https://picsum.photos/seed/still1/800/800", category: "still", title: "晨露" },
    { src: "https://picsum.photos/seed/still2/800/600", category: "still", title: "花语" },
    { src: "https://picsum.photos/seed/still3/800/600", category: "still", title: "器物" },
    { src: "https://picsum.photos/seed/still4/800/1000", category: "still", title: "光影小品" },
];

// ===== Build Gallery =====
const galleryGrid = document.getElementById("galleryGrid");
let currentFilter = "all";
let lightboxIndex = -1;
let filteredPhotos = [...photos];

function createGallery(items) {
    galleryGrid.innerHTML = "";
    items.forEach((photo, index) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        item.dataset.category = photo.category;

        // Add variety: some items span extra rows/columns
        if (index % 7 === 0) item.classList.add("tall");
        if (index % 9 === 0) item.classList.add("wide");

        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.title;
        img.loading = "lazy";

        item.appendChild(img);
        item.addEventListener("click", () => openLightbox(index));
        galleryGrid.appendChild(item);
    });
}

// ===== Filter =====
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;

        if (currentFilter === "all") {
            filteredPhotos = [...photos];
        } else {
            filteredPhotos = photos.filter((p) => p.category === currentFilter);
        }
        createGallery(filteredPhotos);
    });
});

// ===== Lightbox =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

function openLightbox(index) {
    lightboxIndex = index;
    lightboxImg.src = filteredPhotos[index].src;
    lightboxImg.alt = filteredPhotos[index].title;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
}

function prevImage() {
    if (filteredPhotos.length === 0) return;
    lightboxIndex = (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    lightboxImg.src = filteredPhotos[lightboxIndex].src;
}

function nextImage() {
    if (filteredPhotos.length === 0) return;
    lightboxIndex = (lightboxIndex + 1) % filteredPhotos.length;
    lightboxImg.src = filteredPhotos[lightboxIndex].src;
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", prevImage);
lightboxNext.addEventListener("click", nextImage);

// Click background to close
lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
});

// ===== Init =====
createGallery(photos);

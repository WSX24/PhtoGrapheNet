// ===== Config =====
const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "photo_gallery_data";

// ===== State =====
let photos = [];
let currentFilter = "all";
let filteredPhotos = [];
let lightboxIndex = -1;
let isAdmin = false;
let pendingImageData = null;
let pendingImageName = null;

// ===== Load Photos =====
// Priority: localStorage (admin edits) > photos.json (deployed data)
async function loadPhotos() {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            photos = JSON.parse(stored);
            return;
        } catch (e) { /* fall through */ }
    }

    // Load from photos.json
    try {
        const res = await fetch("data/photos.json");
        if (res.ok) {
            photos = await res.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
            return;
        }
    } catch (e) { /* fall through */ }

    // Empty
    photos = [];
}

function persistPhotos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

// ===== Gallery =====
const galleryGrid = document.getElementById("galleryGrid");
const galleryEmpty = document.getElementById("galleryEmpty");

function createGallery(items) {
    galleryGrid.innerHTML = "";
    if (items.length === 0) {
        galleryEmpty.style.display = "block";
        galleryGrid.style.display = "none";
        return;
    }
    galleryEmpty.style.display = "none";
    galleryGrid.style.display = "grid";

    items.forEach((photo, index) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        if (photo.category) item.dataset.category = photo.category;

        if (index % 7 === 0) item.classList.add("tall");
        if (index % 9 === 0) item.classList.add("wide");

        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.title || "";
        img.loading = "lazy";
        img.onerror = function () {
            // Fallback if local image doesn't exist
            this.src = `https://picsum.photos/seed/${photo.id}/800/600`;
        };

        item.appendChild(img);
        item.addEventListener("click", () => openLightbox(index));
        galleryGrid.appendChild(item);
    });
}

// ===== Filter =====
document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
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
const lightboxInfo = document.getElementById("lightboxInfo");

function openLightbox(index) {
    lightboxIndex = index;
    const photo = filteredPhotos[index];
    lightboxImg.src = photo.src;
    lightboxInfo.textContent = photo.title || "";
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
    lightboxInfo.textContent = filteredPhotos[lightboxIndex].title || "";
}

function nextImage() {
    if (filteredPhotos.length === 0) return;
    lightboxIndex = (lightboxIndex + 1) % filteredPhotos.length;
    lightboxImg.src = filteredPhotos[lightboxIndex].src;
    lightboxInfo.textContent = filteredPhotos[lightboxIndex].title || "";
}

document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightboxPrev").addEventListener("click", prevImage);
document.getElementById("lightboxNext").addEventListener("click", nextImage);
lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
});

// ===== Admin =====
const adminOverlay = document.getElementById("adminOverlay");
const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");
const uploadInput = document.getElementById("uploadInput");
const uploadPreview = document.getElementById("uploadPreview");
const uploadTitle = document.getElementById("uploadTitle");
const uploadCategory = document.getElementById("uploadCategory");
const btnUpload = document.getElementById("btnUpload");
const photoList = document.getElementById("photoList");

function openAdmin() {
    adminOverlay.classList.add("active");
    if (isAdmin) {
        showDashboard();
    } else {
        adminLogin.style.display = "block";
        adminDashboard.style.display = "none";
        document.getElementById("loginPassword").value = "";
    }
}

function closeAdmin() {
    adminOverlay.classList.remove("active");
    pendingImageData = null;
    resetUploadForm();
}

function showDashboard() {
    isAdmin = true;
    adminLogin.style.display = "none";
    adminDashboard.style.display = "block";
    renderPhotoList();
}

document.getElementById("adminTrigger").addEventListener("click", openAdmin);
document.getElementById("adminClose").addEventListener("click", closeAdmin);
document.getElementById("adminDashboardClose").addEventListener("click", closeAdmin);
adminOverlay.addEventListener("click", (e) => {
    if (e.target === adminOverlay) closeAdmin();
});

// Login
document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const pw = document.getElementById("loginPassword").value;
    if (pw === ADMIN_PASSWORD) {
        showDashboard();
    } else {
        alert("密码错误");
    }
});

// Logout
document.getElementById("btnLogout").addEventListener("click", () => {
    isAdmin = false;
    adminOverlay.classList.remove("active");
    resetUploadForm();
});

// ===== Upload =====
uploadPreview.addEventListener("click", () => uploadInput.click());
uploadInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

const uploadZone = document.getElementById("uploadZone");
uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = "rgba(255,255,255,0.4)";
});
uploadZone.addEventListener("dragleave", () => {
    uploadZone.style.borderColor = "rgba(255,255,255,0.15)";
});
uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = "rgba(255,255,255,0.15)";
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

function handleFileSelect(file) {
    if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
    }
    pendingImageName = file.name.replace(/\.[^.]+$/, "");
    const reader = new FileReader();
    reader.onload = (e) => {
        pendingImageData = e.target.result;
        uploadPreview.innerHTML = `<img src="${pendingImageData}" alt="预览">`;
        btnUpload.disabled = false;
        if (!uploadTitle.value) {
            uploadTitle.value = pendingImageName;
        }
    };
    reader.readAsDataURL(file);
}

function resetUploadForm() {
    pendingImageData = null;
    pendingImageName = null;
    uploadPreview.innerHTML = "<span>点击或拖拽上传</span>";
    uploadTitle.value = "";
    uploadCategory.value = "landscape";
    btnUpload.disabled = true;
    uploadInput.value = "";
}

btnUpload.addEventListener("click", () => {
    if (!pendingImageData) return;

    const title = uploadTitle.value.trim() || "未命名";
    const category = uploadCategory.value;
    const id = Date.now().toString();
    const ext = pendingImageData.startsWith("data:image/png") ? "png" : "jpg";
    const filename = `${category}_${title}_${id}.${ext}`;

    // src = base64 for immediate display; file = target path for export
    const photo = {
        id,
        src: pendingImageData,
        file: `images/${filename}`,
        category,
        title,
    };
    photos.push(photo);
    persistPhotos();

    // Download image file — user drops it into images/ folder later
    downloadFile(pendingImageData, filename);

    resetUploadForm();
    renderPhotoList();
    refreshGallery();
});

function downloadFile(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

// ===== Photo List Management =====
function renderPhotoList() {
    photoList.innerHTML = "";
    if (photos.length === 0) {
        photoList.innerHTML = '<p class="list-empty">暂无作品，请上传</p>';
        return;
    }
    photos.forEach((photo) => {
        const item = document.createElement("div");
        item.className = "photo-list-item";
        item.innerHTML = `
            <img class="photo-list-thumb" src="${photo.src}" alt="${photo.title}" onerror="this.style.display='none'">
            <div class="photo-list-info">
                <div class="photo-list-title">${escapeHTML(photo.title)} <span style="color:#555;font-size:0.75rem">${photo.src}</span></div>
                <div class="photo-list-cat">${catLabel(photo.category)}</div>
            </div>
            <div class="photo-list-actions">
                <button class="btn-edit" data-id="${photo.id}">编辑</button>
                <button class="btn-del" data-id="${photo.id}">删除</button>
            </div>
        `;
        item.querySelector(".btn-del").addEventListener("click", () => deletePhoto(photo.id));
        item.querySelector(".btn-edit").addEventListener("click", () => editPhoto(photo));
        photoList.appendChild(item);
    });
}

function catLabel(cat) {
    const map = { landscape: "风光", portrait: "人像", street: "街拍", still: "静物" };
    return map[cat] || cat;
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function deletePhoto(id) {
    if (!confirm("确认删除这张作品？")) return;
    photos = photos.filter((p) => p.id !== id);
    persistPhotos();
    renderPhotoList();
    refreshGallery();
}

function editPhoto(photo) {
    const newTitle = prompt("修改标题", photo.title);
    if (newTitle === null) return;
    const newCat = prompt("修改分类\n(landscape=风光, portrait=人像, street=街拍, still=静物)", photo.category);
    if (newCat === null) return;

    photo.title = newTitle.trim() || photo.title;
    const validCats = ["landscape", "portrait", "street", "still"];
    if (validCats.includes(newCat.toLowerCase())) {
        photo.category = newCat.toLowerCase();
    }
    persistPhotos();
    renderPhotoList();
    refreshGallery();
}

// ===== Export / Import =====
document.getElementById("btnExport").addEventListener("click", () => {
    // Export clean data: swap base64 src → local file path for GitHub Pages
    const exportData = photos.map((p) => ({
        id: p.id,
        src: p.file || p.src,
        category: p.category,
        title: p.title,
    }));
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "photos.json";
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("格式错误");
        if (!confirm(`即将导入 ${data.length} 张作品，确认覆盖当前数据？`)) return;
        photos = data;
        persistPhotos();
        renderPhotoList();
        refreshGallery();
        alert("导入完成");
    } catch (err) {
        alert("导入失败: " + err.message);
    }
    e.target.value = "";
});

// Reset
document.getElementById("btnReset").addEventListener("click", async () => {
    if (!confirm("将清空当前作品并重新加载默认数据，确认？")) return;
    localStorage.removeItem(STORAGE_KEY);
    await loadPhotos();
    renderPhotoList();
    refreshGallery();
    alert("已重置");
});

// ===== Refresh Gallery =====
function refreshGallery() {
    if (currentFilter === "all") {
        filteredPhotos = [...photos];
    } else {
        filteredPhotos = photos.filter((p) => p.category === currentFilter);
    }
    createGallery(filteredPhotos);
}

// ===== Init =====
async function init() {
    await loadPhotos();
    filteredPhotos = [...photos];
    createGallery(filteredPhotos);
}

init();

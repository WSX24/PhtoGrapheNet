// ===== IndexedDB =====
const DB_NAME = "PhotoGallery";
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", { keyPath: "id" });
            }
        };
        req.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        req.onerror = () => reject(req.error);
    });
}

function dbPut(photo) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").put(photo);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function dbDelete(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function dbClear() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function dbGetAll() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("photos", "readonly");
        const req = tx.objectStore("photos").getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

// ===== Default Photos =====
const defaultPhotos = [
    { id: "d1", src: "https://picsum.photos/seed/landscape1/800/600", category: "landscape", title: "晨曦山峦" },
    { id: "d2", src: "https://picsum.photos/seed/landscape2/800/1000", category: "landscape", title: "静谧湖泊" },
    { id: "d3", src: "https://picsum.photos/seed/landscape3/800/600", category: "landscape", title: "落日海岸" },
    { id: "d4", src: "https://picsum.photos/seed/landscape4/800/800", category: "landscape", title: "川西秋色" },
    { id: "d5", src: "https://picsum.photos/seed/landscape5/800/600", category: "landscape", title: "云海日出" },
    { id: "d6", src: "https://picsum.photos/seed/portrait1/800/1000", category: "portrait", title: "回眸" },
    { id: "d7", src: "https://picsum.photos/seed/portrait2/800/600", category: "portrait", title: "午后光影" },
    { id: "d8", src: "https://picsum.photos/seed/portrait3/800/1000", category: "portrait", title: "微笑" },
    { id: "d9", src: "https://picsum.photos/seed/street1/800/600", category: "street", title: "雨夜霓虹" },
    { id: "d10", src: "https://picsum.photos/seed/street2/800/800", category: "street", title: "巷弄光影" },
    { id: "d11", src: "https://picsum.photos/seed/street3/800/600", category: "street", title: "城市剪影" },
    { id: "d12", src: "https://picsum.photos/seed/still1/800/800", category: "still", title: "晨露" },
    { id: "d13", src: "https://picsum.photos/seed/still2/800/600", category: "still", title: "花语" },
    { id: "d14", src: "https://picsum.photos/seed/still3/800/600", category: "still", title: "器物" },
    { id: "d15", src: "https://picsum.photos/seed/still4/800/1000", category: "still", title: "光影小品" },
];

// ===== App State =====
let photos = [];
let currentFilter = "all";
let filteredPhotos = [];
let lightboxIndex = -1;
let isAdmin = false;
let pendingImageData = null;
const ADMIN_PASSWORD = "admin123";

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
const uploadZone = document.getElementById("uploadZone");
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

// Drag & drop
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
    const reader = new FileReader();
    reader.onload = (e) => {
        pendingImageData = e.target.result;
        uploadPreview.innerHTML = `<img src="${pendingImageData}" alt="预览">`;
        btnUpload.disabled = false;
        if (!uploadTitle.value) {
            uploadTitle.value = file.name.replace(/\.[^.]+$/, "");
        }
    };
    reader.readAsDataURL(file);
}

function resetUploadForm() {
    pendingImageData = null;
    uploadPreview.innerHTML = "<span>点击或拖拽上传</span>";
    uploadTitle.value = "";
    uploadCategory.value = "landscape";
    btnUpload.disabled = true;
    uploadInput.value = "";
}

btnUpload.addEventListener("click", async () => {
    if (!pendingImageData) return;
    const photo = {
        id: Date.now().toString(),
        src: pendingImageData,
        category: uploadCategory.value,
        title: uploadTitle.value.trim() || "未命名",
    };
    await dbPut(photo);
    photos.push(photo);
    resetUploadForm();
    renderPhotoList();
    refreshGallery();
});

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
            <img class="photo-list-thumb" src="${photo.src}" alt="${photo.title}">
            <div class="photo-list-info">
                <div class="photo-list-title">${escapeHTML(photo.title)}</div>
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

async function deletePhoto(id) {
    if (!confirm("确认删除这张作品？")) return;
    await dbDelete(id);
    photos = photos.filter((p) => p.id !== id);
    renderPhotoList();
    refreshGallery();
}

function editPhoto(photo) {
    const newTitle = prompt("修改标题", photo.title);
    if (newTitle === null) return;
    const cats = ["landscape", "portrait", "street", "still"];
    const currentCat = cats.indexOf(photo.category);
    const newCat = prompt("修改分类\n(landscape=风光, portrait=人像, street=街拍, still=静物)", photo.category);
    if (newCat === null) return;

    photo.title = newTitle.trim() || photo.title;
    if (cats.includes(newCat.toLowerCase())) {
        photo.category = newCat.toLowerCase();
    }
    dbPut(photo).then(() => {
        const idx = photos.findIndex((p) => p.id === photo.id);
        if (idx !== -1) photos[idx] = photo;
        renderPhotoList();
        refreshGallery();
    });
}

// ===== Export / Import =====
document.getElementById("btnExport").addEventListener("click", () => {
    const data = JSON.stringify(photos, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `photography-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
        await dbClear();
        for (const photo of data) {
            await dbPut(photo);
        }
        photos = data;
        renderPhotoList();
        refreshGallery();
        alert("导入完成");
    } catch (err) {
        alert("导入失败: " + err.message);
    }
    e.target.value = "";
});

// Reset to defaults
document.getElementById("btnReset").addEventListener("click", async () => {
    if (!confirm("将清空当前作品并加载演示数据，确认？")) return;
    await dbClear();
    for (const photo of defaultPhotos) {
        await dbPut(photo);
    }
    photos = [...defaultPhotos];
    renderPhotoList();
    refreshGallery();
    alert("已重置为演示数据");
});

// ===== Refresh =====
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
    await openDB();
    photos = await dbGetAll();

    // If empty, seed with defaults
    if (photos.length === 0) {
        for (const photo of defaultPhotos) {
            await dbPut(photo);
        }
        photos = [...defaultPhotos];
    }

    filteredPhotos = [...photos];
    createGallery(filteredPhotos);
}

init();

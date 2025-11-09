// Initialize Supabase
const supabaseUrl = 'https://bdarbfivfvdkqmbunhmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJiZml2ZnZka3FtYnVuaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDc5OTcsImV4cCI6MjA3ODE4Mzk5N30.xuZbNs6NpqjcBl16kFOIjpgloXSfSazELaBFAH4-S00';

const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const form = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const itemsList = document.getElementById('items-list');
const loadingMessage = document.getElementById('loading-message');
const editIdInput = document.getElementById('edit-id');

// Form fields
const itemId = document.getElementById('item-id');
const itemTitle = document.getElementById('item-title');
const itemDescription = document.getElementById('item-description');
const itemPrice = document.getElementById('item-price');
const itemUrl = document.getElementById('item-url');
const itemImage = document.getElementById('item-image');

let isEditing = false;

// Load all items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemData = {
        id: itemId.value.trim(),
        title: itemTitle.value.trim(),
        description: itemDescription.value.trim() || null,
        price: itemPrice.value.trim() || null,
        url: itemUrl.value.trim() || null,
        image_url: itemImage.value.trim() || null,
        is_reserved: false
    };

    try {
        if (isEditing) {
            // Update existing item
            const { error } = await _supabase
                .from('wishlist_items')
                .update({
                    title: itemData.title,
                    description: itemData.description,
                    price: itemData.price,
                    url: itemData.url,
                    image_url: itemData.image_url
                })
                .eq('id', editIdInput.value);

            if (error) throw error;
            alert('Item updated successfully!');
        } else {
            // Insert new item
            const { error } = await _supabase
                .from('wishlist_items')
                .insert([itemData]);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    alert('An item with this ID already exists. Please use a different ID.');
                    return;
                }
                throw error;
            }
            alert('Item added successfully!');
        }

        // Reset form
        resetForm();
        loadItems();
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item: ' + error.message);
    }
});

// Cancel edit
cancelBtn.addEventListener('click', () => {
    resetForm();
});

// Load all items
async function loadItems() {
    try {
        loadingMessage.style.display = 'block';
        itemsList.innerHTML = '';

        const { data: items, error } = await _supabase
            .from('wishlist_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        loadingMessage.style.display = 'none';

        if (!items || items.length === 0) {
            itemsList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No items found. Add your first item above!</p>';
            return;
        }

        items.forEach(item => {
            const itemCard = createItemCard(item);
            itemsList.appendChild(itemCard);
        });
    } catch (error) {
        console.error('Error loading items:', error);
        loadingMessage.textContent = 'Error loading items. Please refresh the page.';
        loadingMessage.style.color = '#e74c3c';
    }
}

// Create item card element
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const reservedBadge = item.is_reserved 
        ? '<span class="reserved-badge">RESERVED</span>' 
        : '<span class="available-badge">AVAILABLE</span>';

    card.innerHTML = `
        <div class="item-header">
            <div>
                <div class="item-title">${escapeHtml(item.title)} ${reservedBadge}</div>
                <div class="item-id">ID: ${escapeHtml(item.id)}</div>
            </div>
            <div class="item-actions">
                <button class="btn btn-edit" onclick="editItem('${item.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        </div>
        <div class="item-details">
            ${item.description ? `<p><strong>Description:</strong> ${escapeHtml(item.description)}</p>` : ''}
            ${item.price ? `<p><strong>Price:</strong> ${escapeHtml(item.price)}</p>` : ''}
            ${item.url ? `<p><strong>URL:</strong> <a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a></p>` : ''}
            ${item.image_url ? `<p><strong>Image:</strong> <a href="${escapeHtml(item.image_url)}" target="_blank">View Image</a></p>` : ''}
            ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="item-image-preview" onerror="this.style.display='none'">` : ''}
        </div>
    `;

    return card;
}

// Edit item
async function editItem(itemId) {
    try {
        const { data: item, error } = await _supabase
            .from('wishlist_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;

        // Populate form
        editIdInput.value = item.id;
        itemId.value = item.id;
        itemId.disabled = true; // Disable ID editing
        itemTitle.value = item.title || '';
        itemDescription.value = item.description || '';
        itemPrice.value = item.price || '';
        itemUrl.value = item.url || '';
        itemImage.value = item.image_url || '';

        // Change form to edit mode
        isEditing = true;
        formTitle.textContent = 'Edit Item';
        submitBtn.textContent = 'Update Item';
        cancelBtn.style.display = 'inline-block';

        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading item for edit:', error);
        alert('Error loading item: ' + error.message);
    }
}

// Delete item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await _supabase
            .from('wishlist_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        alert('Item deleted successfully!');
        loadItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item: ' + error.message);
    }
}

// Reset form
function resetForm() {
    form.reset();
    editIdInput.value = '';
    itemId.disabled = false;
    isEditing = false;
    formTitle.textContent = 'Add New Item';
    submitBtn.textContent = 'Add Item';
    cancelBtn.style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;


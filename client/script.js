const API = 'http://localhost:3000/items';
let editingId = null;

document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value
    };

    if (editingId) {
        await fetch(`${API}/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        editingId = null;
        document.getElementById('submitBtn').textContent = 'Add Item';
    } else {
        await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    e.target.reset();
    loadItems();
});

async function loadItems() {
    const res = await fetch(API);
    const items = await res.json();

    document.getElementById('itemsTable').innerHTML = items.map(item => `
        <tr class="border-b border-gray-700">
            <td class="p-3">${item.name}</td>
            <td class="p-3">${item.description}</td>
            <td class="p-3">${item.price}</td>
            <td class="p-3">${item.category}</td>
            <td class="p-3">
                <button onclick="editItem('${item._id}')" class="px-3 py-1 bg-yellow-500 rounded mr-2">Edit</button>
                <button onclick="deleteItem('${item._id}')" class="px-3 py-1 bg-red-500 rounded">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function editItem(id) {
    const res = await fetch(API);
    const items = await res.json();
    const item = items.find(i => i._id === id);

    document.getElementById('name').value = item.name;
    document.getElementById('description').value = item.description;
    document.getElementById('price').value = item.price;
    document.getElementById('category').value = item.category;

    editingId = id;
    document.getElementById('submitBtn').textContent = 'Update Item';
}

async function deleteItem(id) {
    if (confirm('Are you sure?')) {
        await fetch(`${API}/${id}`, { method: 'DELETE' });
        loadItems();
    }
}

loadItems();

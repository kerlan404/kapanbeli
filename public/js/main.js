// Add interactivity to the CRUD buttons

document.addEventListener('DOMContentLoaded', function() {
    // Add product button functionality
    const addProductBtn = document.querySelector('.btn-add-product');
    if(addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            alert('Add new product functionality would be implemented here');
        });
    }

    // Edit buttons functionality
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('tr').querySelector('.product-name').textContent;
            alert(`Edit functionality for ${productName} would be implemented here`);
        });
    });

    // Delete buttons functionality
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('tr').querySelector('.product-name').textContent;
            const confirmDelete = confirm(`Are you sure you want to delete ${productName}?`);
            if(confirmDelete) {
                this.closest('tr').remove();
                alert(`${productName} has been deleted`);
            }
        });
    });

    // Shopping list button functionality
    const shoppingListBtn = document.querySelector('.btn-shopping-list');
    if(shoppingListBtn) {
        shoppingListBtn.addEventListener('click', function() {
            alert('Shopping list functionality would be implemented here');
        });
    }
});
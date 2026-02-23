const axios = require('axios');

async function testNotesAPI() {
    try {
        // Ganti dengan sesi atau token autentikasi yang valid jika diperlukan
        console.log('Testing Notes API...');
        
        // Mencoba mendapatkan semua catatan
        console.log('Getting all notes...');
        const getResponse = await axios.get('http://localhost:3000/api/notes');
        console.log('Get notes response:', getResponse.data);
        
        // Mencoba membuat catatan baru
        console.log('Creating a new note...');
        const createResponse = await axios.post('http://localhost:3000/api/notes', {
            title: 'Test Note',
            content: 'This is a test note created by the test script.'
        });
        console.log('Create note response:', createResponse.data);
        
        // Mendapatkan ID catatan yang baru dibuat
        const noteId = createResponse.data.note.id;
        console.log('Created note ID:', noteId);
        
        // Mencoba mengedit catatan
        console.log('Updating the note...');
        const updateResponse = await axios.put(`http://localhost:3000/api/notes/${noteId}`, {
            title: 'Updated Test Note',
            content: 'This is an updated test note.'
        });
        console.log('Update note response:', updateResponse.data);
        
        // Mencoba menghapus catatan
        console.log('Deleting the note...');
        const deleteResponse = await axios.delete(`http://localhost:3000/api/notes/${noteId}`);
        console.log('Delete note response:', deleteResponse.data);
        
        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Error during API test:', error.response?.data || error.message);
    }
}

testNotesAPI();
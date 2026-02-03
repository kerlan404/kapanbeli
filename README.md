# Kapan Beli - Shopping List Manager

A simple shopping list manager application built with HTML, CSS, JavaScript, and Node.js/Express.

## Project Structure

```
kapanbeli/
├── package.json
├── package-lock.json
├── app.js                 # Main Express server file
├── public/
│   ├── css/
│   │   └── style.css      # Additional CSS files
│   ├── js/
│   │   └── main.js        # Additional JavaScript files
│   └── images/            # Image assets
└── views/
    └── index.html         # Main HTML file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd kapanbeli
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
or
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Development

For development with auto-restart on file changes:
```bash
npm run dev
```

## Features

- Product management (add, edit, delete)
- Shopping list functionality
- Stock level tracking
- Category filtering
- Dark mode toggle
- Responsive design

## Troubleshooting

### Common Issues

1. **UI not updating after changes**: Make sure you're viewing the app at `http://localhost:3000`, not using Live Server on the HTML file directly.

2. **Port already in use**: If you get an EADDRINUSE error, change the port in `app.js` or kill the process using that port.

3. **Missing dependencies**: Run `npm install` again to ensure all dependencies are installed.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Notes

- The main UI is in `views/index.html`
- Static assets (CSS, JS, images) should go in the `public` folder
- The Express server serves files from both `public` and `views` directories
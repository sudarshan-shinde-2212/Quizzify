export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <a href="/" className="bg-black text-white px-4 py-2 rounded-lg">Return Home</a>
      </div>
    </div>
  );
}

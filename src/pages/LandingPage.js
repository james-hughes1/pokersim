import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Poker Simulator</h1>
      <p className="mb-6 text-center">The most thrilling poker experience online.</p>
      <button
        onClick={() => navigate('/chat')}
        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
      >
        Start Chatting with Poker AI
      </button>
    </div>
  );
}

export default LandingPage;

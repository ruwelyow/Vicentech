<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    

    <title>@yield('title', 'Diocesan Shrine of San Vicente Ferrer')</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- Blackletter fonts for certificates -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=MedievalSharp&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx', 'resources/css/pray.css', 'resources/css/events.css'])

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom CSS -->
    <link href="{{ asset('css/styles.css') }}" rel="stylesheet">

    <style>
        /* Floating Chat Button Styles */
        .chat-button {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background-color: #CD8B3E;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 9999px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            z-index: 50;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
        }

        .chat-button:hover {
            background-color: #B77B35;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .chat-button svg {
            width: 1.5rem;
            height: 1.5rem;
        }

        /* Chat bubble animation */
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }

        .chat-button.pulse {
            animation: pulse 2s infinite;
        }

        /* Chat Window Styles */
        .chat-window {
            position: fixed;
            bottom: 5rem;
            right: 2rem;
            width: 300px;
            height: 400px;
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 49;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-window.active {
            display: flex;
        }

        .chat-header {
            background-color: #CD8B3E;
            color: white;
            padding: 1rem;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-messages {
            flex-grow: 1;
            padding: 1rem;
            overflow-y: auto;
        }

        .chat-input {
            border-top: 1px solid #e5e7eb;
            padding: 1rem;
            display: flex;
            gap: 0.5rem;
        }

        .chat-input input {
            flex-grow: 1;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            outline: none;
        }

        .chat-input input:focus {
            border-color: #CD8B3E;
            ring: 2px solid #CD8B3E;
        }

        .close-chat {
            cursor: pointer;
            padding: 0.25rem;
        }

        .close-chat:hover {
            opacity: 0.8;
        }
    </style>
</head>
<body class="font-sans antialiased">

        @include('layouts.navigation')

        <!-- Page Heading -->
        @if (isset($header))
            <header class="bg-white shadow">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {{ $header }}
                </div>
            </header>
        @endif

        <!-- Page Content -->
        <main>
            @yield('content')
        </main>
    </div>

    <!-- React Root -->
    <div id="react-root"></div>

    <!-- Floating Chat Button -->
    <button class="chat-button pulse" onclick="toggleChat()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Chat with us
    </button>

    <!-- Chat Window -->
    <div class="chat-window" id="chatWindow">
        <div class="chat-header">
            <span>Chat Support</span>
            <span class="close-chat" onclick="toggleChat()">×</span>
        </div>
        <div class="chat-messages" id="chatMessages">
            <!-- Messages will be added here -->
            <div class="text-center text-gray-500 text-sm my-4">
                How can we help you today?
            </div>
        </div>
        <div class="chat-input">
            <input type="text" placeholder="Type your message..." id="messageInput" onkeypress="handleKeyPress(event)">
        </div>
    </div>

    <!-- Scripts -->
    @stack('scripts')

    <script>
        // Navbar Dropdown Functionality
        document.addEventListener('DOMContentLoaded', function() {
            const dropdowns = ['dropdownNavbar', 'inquiriesDropdown'];
            let openDropdown = null;

            function handleDropdownToggle(e) {
                e.preventDefault();
                const toggleId = e.currentTarget.getAttribute('data-dropdown-toggle');
                const dropdown = document.getElementById(toggleId);

                if (openDropdown === toggleId) {
                    openDropdown = null;
                    dropdown?.classList.add('hidden');
                } else {
                    openDropdown = toggleId;
                    dropdown?.classList.remove('hidden');
                }
            }

            function handleClickOutside(e) {
                const isClickInside = dropdowns.some(id => {
                    const dropdown = document.getElementById(id);
                    return dropdown?.contains(e.target);
                });

                if (!isClickInside) {
                    openDropdown = null;
                    dropdowns.forEach(id => {
                        const dropdown = document.getElementById(id);
                        dropdown?.classList.add('hidden');
                    });
                }
            }

            const aboutButton = document.getElementById('dropdownNavbarLink');
            const inquiriesButton = document.getElementById('inquiriesDropdownLink');

            aboutButton?.addEventListener('click', handleDropdownToggle);
            inquiriesButton?.addEventListener('click', handleDropdownToggle);
            document.addEventListener('mousedown', handleClickOutside);
        });

        // Existing chat functionality
        function toggleChat() {
            const chatWindow = document.getElementById('chatWindow');
            chatWindow.classList.toggle('active');
            document.querySelector('.chat-button').classList.remove('pulse');
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                
                if (message) {
                    addMessage(message, 'user');
                    input.value = '';
                    
                    // Simulate response after a short delay
                    setTimeout(() => {
                        addMessage('Thank you for your message. Our support team will respond shortly.', 'system');
                    }, 1000);
                }
            }
        }

        function addMessage(text, sender) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `my-2 p-2 rounded-lg ${sender === 'user' ? 'bg-[#CD8B3E]/10 ml-auto' : 'bg-gray-100'} max-w-[80%] ${sender === 'user' ? 'text-right' : 'text-left'}`;
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>
</html> 
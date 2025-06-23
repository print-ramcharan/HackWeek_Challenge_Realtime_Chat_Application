const sock = io();
const form = document.getElementById('chatForm');
const input = document.getElementById('chatInput');
const log = document.getElementById('chatlog');

// When the form is submitted, push message to server
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  sock.emit('chat message', text);
  input.value = '';
});

// When a message arrives, show it in the log
sock.on('chat message', msg => {
  const line = document.createElement('li');
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
});

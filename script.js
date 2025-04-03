// Firebase config (same as before)
const firebaseConfig = {
  apiKey: "AIzaSyCCiNxiTnwqGKWZkKbILCD9wJInZdz9eYo",
  authDomain: "mpqhelper-5cee5.firebaseapp.com",
  databaseURL: "https://mpqhelper-5cee5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mpqhelper-5cee5",
  storageBucket: "mpqhelper-5cee5.firebasestorage.app",
  messagingSenderId: "513036665304",
  appId: "1:513036665304:web:cd99b544f277f7c62832ad"
};

// Initialize Firebase (same as before)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, onValue, set, get, remove } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

let currentRoomId = null;
let currentUserId = null;
let roomRef = null;
let isCreator = false;

// Authenticate Anonymously
signInAnonymously(auth)
  .then(() => {
    console.log("User signed in anonymously");
  })
  .catch((error) => {
    console.error("Error signing in anonymously: ", error);
  });

function joinRoom() {
  const roomIdInput = document.getElementById('roomId');
  const userIdInput = document.getElementById('userId');
  const roomId = roomIdInput.value.trim();
  const userId = userIdInput.value.trim();

  if (roomId && userId) {
    currentRoomId = roomId;
    currentUserId = userId;
    const usersRef = ref(database, `rooms/${currentRoomId}/users`);

    get(usersRef)
      .then((snapshot) => {
        let users = snapshot.val() ? Object.keys(snapshot.val()) : [];

        if (users.length >= 4 && !users.includes(userId)) {
          alert('The room is at maximum capacity (4 players).');
          return;
        }

        roomRef = ref(database, `rooms/${currentRoomId}/users/${currentUserId}`);

        set(roomRef, true)
          .then(() => {
            const url = new URL(window.location.href);
            url.searchParams.set('roomId', currentRoomId);
            window.history.pushState({}, '', url);
            createPlatformUI();
            setupRoomListener();
            document.querySelector('.initial-page').style.display = 'none';
            document.querySelector('.room-page').style.display = 'flex';

            get(ref(database, `rooms/${currentRoomId}/creatorId`))
              .then((creatorSnapshot) => {
                isCreator = !creatorSnapshot.exists();
                if (isCreator) {
                  set(ref(database, `rooms/${currentRoomId}/creatorId`), currentUserId);
                }
                showCreatorButtons();
              });
          })
          .catch((error) => {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
          });
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        alert('Failed to join room. Please try again.');
      });
  } else {
    alert('Please enter both Room ID and User ID.');
  }
}

document.getElementById('joinRoomButton').addEventListener('click', joinRoom);

// Add event listener for Enter key press on input fields
document.getElementById('roomId').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    joinRoom();
  }
});

document.getElementById('userId').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    joinRoom();
  }
});

function getRoomIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('roomId');
}

function createPlatformUI() {
  const platformTableBody = document.getElementById('platforms');
  platformTableBody.style.display = 'table';
  platformTableBody.innerHTML = '';

  if (!currentRoomId) {
    document.getElementById('clearRoomButton').style.display = 'none';
    document.getElementById('closeRoomButton').style.display = 'none';
    return;
  }

  document.getElementById('clearRoomButton').style.display = 'block';
  showCreatorButtons();

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  const clearButton = document.getElementById('clearRoomButton');
  const closeButton = document.getElementById('closeRoomButton');

  buttonContainer.appendChild(clearButton);
  buttonContainer.appendChild(closeButton);

  document.querySelector('.room-page').insertBefore(buttonContainer, platformTableBody);

  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#f2f2f2';
  const platformHeader = document.createElement('th');
  platformHeader.textContent = 'Platforms';
  headerRow.appendChild(platformHeader);
  platformTableBody.appendChild(headerRow);

  for (let i = 10; i >= 1; i--) {
    const row = document.createElement('tr');
    const platformCell = document.createElement('td');
    platformCell.textContent = `Platform ${i}`;
    row.appendChild(platformCell);
    platformTableBody.appendChild(row);
  }

  updateUserHeaders();
}

function updateUserHeaders() {
  const usersRef = ref(database, `rooms/${currentRoomId}/users`);
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val() ? Object.keys(snapshot.val()) : [];
    const headerRow = document.querySelector('#platforms tr');

    while (headerRow.cells.length > 1) {
      headerRow.deleteCell(1);
    }

    users.forEach(user => {
      const userHeader = document.createElement('th');
      userHeader.textContent = user;
      headerRow.appendChild(userHeader);
    });

    updateUserCells(users);
  });
}

function updateUserCells(users) {
  const platformTableBody = document.getElementById('platforms');
  const platformRows = platformTableBody.querySelectorAll('tr:not(:first-child)');

  platformRows.forEach((row, index) => {
    const platformNumber = 10 - index;

    while (row.cells.length > 1) {
      row.deleteCell(1);
    }

    users.forEach(user => {
      const userCell = document.createElement('td');
      userCell.classList.add('choice-container');
      userCell.dataset.user = user;
      userCell.dataset.platform = platformNumber;

      const choiceWrapperContainer = document.createElement('div');
      choiceWrapperContainer.classList.add('choice-wrapper-container');

      for (let choice = 1; choice <= 4; choice++) {
        const choiceWrapper = document.createElement('div');
        choiceWrapper.classList.add('choice-wrapper');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = choice;
        checkbox.dataset.platform = platformNumber;
        checkbox.dataset.user = user;
        checkbox.checked = false;

        const label = document.createElement('div');
        label.classList.add('choice-label');
        label.textContent = choice;

        choiceWrapper.appendChild(checkbox);
        choiceWrapper.appendChild(label);
        choiceWrapperContainer.appendChild(choiceWrapper);
      }
      userCell.appendChild(choiceWrapperContainer);
      row.appendChild(userCell);
    });

    if (index % 2 === 0) {
      row.classList.add('even-row');
    } else {
      row.classList.add('odd-row');
      row.style.backgroundColor = '#f2f2f2';
    }

    row.addEventListener('mouseover', () => {
      row.style.backgroundColor = '#e2e2e2';
    });
    row.addEventListener('mouseout', () => {
      if (index % 2 === 0) {
        row.style.backgroundColor = 'white';
      } else {
        row.style.backgroundColor = '#f2f2f2';
      }
    });
  });
}

function setupRoomListener() {
  if (currentRoomId) {
    const platformRef = ref(database, `rooms/${currentRoomId}/platforms`);
    onValue(platformRef, (snapshot) => {
      if (snapshot.exists()) {
        updateUIState(snapshot.val());
      } else {
        updateUIState({});
      }
    });

    const roomDeletionRef = ref(database, `rooms/${currentRoomId}`);
    onValue(roomDeletionRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (!isCreator) {
          alert('Room closed by creator!');
          window.location.href = 'https://webarebears-helper.github.io/mpq';
        }
      }
    });
  }
}

document.getElementById('platforms').addEventListener('change', (event) => {
  if (event.target.type === 'checkbox') {
    const checkbox = event.target;
    const platformNumber = checkbox.dataset.platform;
    const user = checkbox.dataset.user;
    const choice = checkbox.value;

    if (currentRoomId) {
      const userRef = ref(database, `rooms/${currentRoomId}/platforms/${platformNumber}/${user}`);
      set(userRef, checkbox.checked ? choice : null);
    }
  }
});

function updateUIState(platformData) {
  document.querySelectorAll('.choice-container').forEach(userCell => {
    const platform = userCell.dataset.platform;
    const user = userCell.dataset.user;
    const checkboxes = userCell.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.disabled = false;
      checkbox.checked = false;
      checkbox.parentElement.style.backgroundColor = '';
    });

    const platformUsersData = platformData[platform] || {};
    Object.entries(platformUsersData).forEach(([otherUser, otherChoice]) => {
      if (otherUser !== user && otherChoice) {
        checkboxes.forEach(checkbox => {
          if (checkbox.value === otherChoice) {
            checkbox.disabled = true;
          }
        });
      }
    });

    Object.entries(platformUsersData).forEach(([dbUser, dbChoice]) => {
      if (dbChoice) {
        checkboxes.forEach(checkbox => {
          if (checkbox.value === dbChoice) {
            checkbox.checked = true;
          }
        });
      }
    });

    const currentUserChoice = platformUsersData[user];
    if (currentUserChoice) {
      checkboxes.forEach(checkbox => {
        if (checkbox.value !== currentUserChoice) {
          checkbox.disabled = true;
        }
      });
    }

    const uncheckedChoices = Array.from(checkboxes).filter(checkbox => !checkbox.checked && !checkbox.disabled);
    if (uncheckedChoices.length === 1) {
      uncheckedChoices[0].parentElement.style.backgroundColor = 'green';
    }
  });
}

function clearRoom() {
  if (currentRoomId) {
    const platformRef = ref(database, `rooms/${currentRoomId}/platforms`);
    set(platformRef, null)
      .then(() => {
        alert('Platform choices cleared!');
        updateUIState({});
      })
      .catch((error) => {
        console.error('Error clearing platform choices:', error);
        alert('Failed to clear platform choices. Please try again.');
      });
  }
}

document.getElementById('clearRoomButton').addEventListener('click', clearRoom);

function showCreatorButtons() {
  if (isCreator) {
    document.getElementById('closeRoomButton').style.display = 'block';
  } else {
    document.getElementById('closeRoomButton').style.display = 'none';
  }
}

function closeRoom() {
  if (isCreator && currentRoomId) {
    remove(ref(database, `rooms/${currentRoomId}`))
      .then(() => {
        alert('Room closed!');
        window.location.href = 'https://webarebears-helper.github.io/mpq';
      })
      .catch((error) => {
        console.error('Error closing room:', error);
        alert('Failed to close room. Please try again.');
      });
  }
}

document.getElementById('closeRoomButton').addEventListener('click', closeRoom);

const roomIdFromUrl = getRoomIdFromUrl();
if (roomIdFromUrl) {
  currentRoomId = roomIdFromUrl;
  createPlatformUI();
  setupRoomListener();
  document.querySelector('.initial-page').style.display = 'none';
  document.querySelector('.room-page').style.display = 'flex';
} else {
  document.getElementById('platforms').style.display = 'none';
  document.querySelector('.room-page').style.display = 'none';
}

function handleCheckboxEnter(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.checked = !event.target.checked;
    const changeEvent = new Event('change', { bubbles: true });
    event.target.dispatchEvent(changeEvent);
  }
}

// Attach event listeners to all checkboxes
document.addEventListener('DOMContentLoaded', function() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('keydown', handleCheckboxEnter);
  });
});

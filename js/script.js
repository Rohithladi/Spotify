let current = new Audio();
let songs;
let currfolder;
let audioContext;
let analyser;
let source;
let frequencyData;
let currentCard;
let convolver;
let delay;
let bassBoost;

async function getsongs(folder) {
    currfolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    songs = [];
    let as = div.getElementsByTagName("a");
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show all the songs in the playlist
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = "";
    for (const song of songs) {
        songul.innerHTML += `<li>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div class="songname">${song.replaceAll("%20", " ")}</div>
                <div class="songartist">Artist:Rohit</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt=""> 
            </div>
        </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;
}


// Select the search bar and song list
const searchBar = document.getElementById('search-bar');
const songList = document.querySelector('.songlist ul');

// Function to filter songs based on search input
searchBar.addEventListener('keyup', () => {
    const searchTerm = searchBar.value.toLowerCase();
    
    // Clear the current song list
    songList.innerHTML = '';

    // Filter through the songs[] array
    const filteredSongs = songs.filter(song => song.toLowerCase().includes(searchTerm));

    // Update the song list with the filtered results
    filteredSongs.forEach(song => {
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div class="songname">${song.replaceAll("%20", " ")}</div>
                <div class="songartist">Artist: Rohit</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt=""> 
            </div>
        `;

        // Add click event listener to the list item
        listItem.addEventListener('click', () => {
            playMusic(song);
        });

        songList.appendChild(listItem);
    });

    // If no results are found
    if (filteredSongs.length === 0) {
        songList.innerHTML = `<li>No songs found</li>`;
    }
});


function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}


const playMusic = (track, pause = false) => {

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaElementSource(current);

        // Create effect nodes
        convolver = audioContext.createConvolver();
        delay = audioContext.createDelay();
        delay.delayTime.value = 0.5;
        bassBoost = audioContext.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.value = 150;
        bassBoost.gain.value = 10;

        // Connect default effect chain
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume(); // Resume audio context if suspended
    }

    current.src = `/${currfolder}/` + track;
    if (!pause) {
        current.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";

    // Draw the equalizer
    drawEqualizer();

};
function drawEqualizer() {
    if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        const canvas = document.getElementById('equalizer');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / frequencyData.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < frequencyData.length; i++) {
            barHeight = frequencyData[i] / 2;

            // Adjust the color for a dark background
            const r = Math.min(255, barHeight * 1.5);
            const g = Math.min(255, barHeight * 1.2);
            const b = 255 - barHeight * 0.5;

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        requestAnimationFrame(drawEqualizer);
    }
}

async function displayalbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardcontainer");

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-2)[1];
            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
            let response = await a.json();

            cardContainer.innerHTML += `<div class="card" id="card"data-folder="${folder}">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="35" height="35">
                        <circle cx="14" cy="14" r="12" fill="#1fdf64" stroke="black" stroke-width="1.5" />
                        <polygon points="11,9 18,14 11,19" fill="none" stroke="black" stroke-width="1.5" stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.png" alt="image">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {




    //List of all the songs
    await getsongs("songs/ncs")
    playMusic(songs[0], true)



    //Display all the albums in the page
    displayalbums();

    //Attach an event listener to play and pre and next
    play.addEventListener("click", () => {
        if (current.paused) {
            current.play();
            play.src = "img/pause.svg"
        }
        else {
            current.pause()
            play.src = "img/play.svg"
        }
    })
    //Listen for time update
    current.addEventListener("timeupdate", () => {
        console.log(current.currentTime, current.duration)
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(current.currentTime)} / ${secondsToMinutesSeconds(current.duration)}`
        document.querySelector(".circle").style.left = (current.currentTime / current.duration) * 100 + "%"
    })

    //Add an event listener to seekbar
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    let isDragging = false; // To keep track if the user is dragging

    // Function to calculate the current percentage and update song time
    const updateSeekbar = (e) => {
        if (!current.duration || current.duration === Infinity) return; // Ensure valid duration

        let rect = seekbar.getBoundingClientRect();
        let offsetX;

        if (e.type.startsWith('touch')) {
            offsetX = e.touches[0].clientX - rect.left;
        } else {
            offsetX = e.clientX - rect.left;
        }

        let percent = (offsetX / seekbar.getBoundingClientRect().width) * 100;
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;

        // Update the circle position
        circle.style.left = percent + "%";

        // Update the current time of the song
        current.currentTime = (current.duration * percent) / 100;
    };

    // Event when clicking the seekbar
    seekbar.addEventListener("click", e => {
        updateSeekbar(e);
    });

    // Event when pressing down on the circle (start dragging)
    circle.addEventListener("mousedown", () => {
        isDragging = true;
    });

    // Event for moving the circle while dragging (updating seekbar)
    window.addEventListener("mousemove", e => {
        if (isDragging) {
            let rect = seekbar.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;

            // Prevent dragging outside the bounds
            if (offsetX >= 0 && offsetX <= rect.width) {
                let percent = (offsetX / rect.width) * 100;
                circle.style.left = percent + "%";
                current.currentTime = (current.duration * percent) / 100;
            }
        }
    });

    // Event for releasing the drag (stop dragging)
    window.addEventListener("mouseup", () => {
        isDragging = false;
    });


    //Add an event listener to Hamburger

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //Add an event listener to close

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%"
    })


    //Add an event listener to previous 
    pre.addEventListener("click", () => {
        console.log("perviousclicked")
        let index = songs.indexOf(current.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })


    //Add an event listener to next
    next.addEventListener("click", () => {
        console.log("Next clicked")
        let index = songs.indexOf(current.src.split("/").slice(-1)[0])

        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })
    //Add an event listener to volume
    // Selecting the volume input slider
    const volumeSlider = document.querySelector(".range").getElementsByTagName("input")[0];

    // Function to update the volume
    const updateVolume = (e) => {
        current.volume = parseInt(e.target.value) / 100;
    };

    // Event to update volume as the slider is dragged (real-time updates)
    volumeSlider.addEventListener("input", updateVolume);

    // Event to set volume when slider drag is finished (for final confirmation)
    volumeSlider.addEventListener("change", updateVolume);


    //Add an event listener to volume button
    volu.addEventListener("click", () => {
        if (current.muted == false) {
            current.muted = true
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0
            volu.src = "img/mute.svg"

        }
        else {
            current.muted = false
            document.querySelector(".range").getElementsByTagName("input")[0].value = 50
            volu.src = "img/volume.svg"
        }
    })

    document.querySelector("#echo").addEventListener("click", () => {
      
         
            delay = audioContext.createDelay();
            delay.delayTime.value = 0.1;
            source.connect(delay);
            delay.connect(analyser);
            analyser.connect(audioContext.destination);
        
    });

    document.querySelector("#bass-boost").addEventListener("click", () => {

        bassBoost = audioContext.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.value = 150;
        bassBoost.gain.value = 15;
        document.getElementById('bass-boost').style.background = 'green';
        source.connect(bassBoost);
        bassBoost.connect(analyser);
        analyser.connect(audioContext.destination);

    });
    document.querySelector("#no-effect").addEventListener("click", () => {
        // Disconnect all effects
        if (convolver) {
            convolver.disconnect();
            convolver = null;
            document.getElementById('bass-boost').style.background = 'linear-gradient(145deg, rgb(0 0 0), rgb(0 14 3))';


        }

        if (delay) {
            delay.disconnect();
            delay = null;
            document.getElementById('bass-boost').style.background = 'llinear-gradient(145deg, rgb(0 0 0), rgb(0 14 3))';

        }

        if (bassBoost) {
            bassBoost.disconnect();
            bassBoost = null;
            document.getElementById('bass-boost').style.background = 'linear-gradient(145deg, rgb(0 0 0), rgb(0 14 3))';

        }

        // Reconnect the source to the analyser directly
        source.disconnect();
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        document.getElementById('bass-boost').style.background = 'linear-gradient(145deg, rgb(0 0 0), rgb(0 14 3))';

    });



    circle.addEventListener("mousedown", () => {
        isDragging = true;
    });

    // Event for moving the circle while dragging (updating seekbar)
    window.addEventListener("mousemove", e => {
        if (isDragging) {
            updateSeekbar(e);
        }
    });

    // Event for releasing the drag (stop dragging)
    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Touch events for mobile devices
    circle.addEventListener("touchstart", (e) => {
        isDragging = true;
        updateSeekbar(e);
    });

    window.addEventListener("touchmove", (e) => {
        if (isDragging) {
            updateSeekbar(e);
        }
    });

    window.addEventListener("touchend", () => {
        isDragging = false;
    });


    // Select all the cards
    const cards = document.querySelectorAll('.cardcontainer');

// Select the playbar
const playbar = document.querySelector('.playbar');

// Add click event listener to each card
cards.forEach(card => {
    card.addEventListener('click', () => {
        // Show the playbar when the card is clicked
        playbar.style.display = 'block';

        

    });
});

    
    const cards1 = document.querySelectorAll('.cardcontainer');

    // Function to handle the click event for changing max-height
    const handleCardClick = () => {
        // Check if the screen width is 1200px or less
        if (window.matchMedia("(max-width: 1200px)").matches) {
            cards1.forEach(card => {
                card.addEventListener("click", () => {
                    card.style.maxHeight = "58vh";  // Changes max-height of clicked card
                });
            });
        }
    };
    
    // Call the function initially to set up the event listeners
    handleCardClick();
    
    // Optional: Add a resize event listener to adjust behavior dynamically when the window is resized
    window.addEventListener('resize', handleCardClick);
    

      






    

    
     

}




main()
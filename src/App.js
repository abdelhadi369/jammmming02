import React, { useEffect, useState } from "react";
function Login() {
  const clientId = 'a466502956524b1eaee6655106696404';
  const redirectURI = 'http://localhost:3000';
  const Auth = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectURI}&scope=playlist-modify-public playlist-modify-private`;
  
  return (
    <div>
      <button><a href={Auth}>Login</a></button> 
    </div>
  );
}
function SearchBar({ search, setSearch, token, setTracks}) {
  const handleInput = (e) => {
    setSearch(e.target.value);
  };
async function searchSpotify(){
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track,artist&limit=10`;
  const response = await fetch(url,{
    method : 'GET',
    headers : {
      Authorization : `Bearer ${token}`
    }
  });
  if(!response.ok){
    throw new Error('Failed to fetch data from Spotify');
  }
  const data = await response.json();
  
  setTracks(data.tracks.items)
}
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={handleInput}
        placeholder="Search for a track"
      />
      <button onClick={searchSpotify}>Search</button>
    </div>
  );
}
function Track({tracks, setSelectedTracks, selectedTracks}){
 
return (
  <div>
    {tracks.map((track) =>(
      <div key={track.id}>
        <img 
        src={track.album.images[0].url}
        style={{ width: '100px', height: '100px' }}
        />
        <p>{track.name}-{track.artists.map( artist => artist.name).join( ', ')}</p>
        <button onClick={() => {
  if (!selectedTracks.some(t => t.uri === track.uri)) {
    setSelectedTracks([...selectedTracks, { name: track.name, artist: track.artists.map(artist => artist.name).join(', '), uri: track.uri }]);
  }
}}>Add to Playlist</button>

        
      </div>
    ))}
  </div>
)
}
function CreatePlaylist({token, setPlaylistName,selectedTracks ,playlistName,playlistId, setPlaylistId}){
  
 const [isEditing, setIsEditing] = useState(false)
  const createAndSavePlaylist = async () => {
    const userProfile = await fetch('https://api.spotify.com/v1/me',{
      headers : {
        Authorization : `Bearer ${token}`
      }
    });
    if(!userProfile.ok){
      throw new Error('Failed to fetch user profile')
    }
    const user = await userProfile.json();
  
    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`,{
      method : 'POST',
      headers : {
        Authorization : `Bearer ${token}`,
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        name : playlistName,
        public : false,
      })
    });
    if (!playlistResponse.ok){
      throw new Error('Failed to create playlist')
    }
    const playlist = await playlistResponse.json();
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,{
      method : 'POST',
      headers :{
        Authorization : `Bearer ${token}`,
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
       uris : selectedTracks.map(track => track.uri)
      })
    });
     
  };
  const handleNameChange = (e) => setPlaylistName(e.target.value);

     const handleRename = async () =>{
      setIsEditing(false);
      if(playlistId){
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`,{
          method : 'PUT',
          headers : {
            Authorization : `Bearer ${token}`,
           'Content-Type': 'application/json' 
          },
          body : JSON.stringify({name : playlistName})
        });
        
      }
     }
   
  return (
    <div>
      <h2 onClick={() => setIsEditing(true)}>
      { isEditing ? 
        (<input
      type="text"
      value={playlistName}
      onChange={handleNameChange}
      onBlur={handleRename}
      
      />) : (playlistName)}
      </h2>
      <h3>Tracks in Playlist :</h3>
      <ul>
        {selectedTracks.map((track) =>(
          <li key={track.uri}>
           {track.name} - {track.artist}
          </li>
        ))}
      </ul>
      <button onClick={createAndSavePlaylist}>Save Playlist</button>
    </div>
  )
}

function App() {
  const [tracks, setTracks] = useState([]);
  const [token, setToken] = useState('');
  const [search, setSearch] = useState('');
  const [playlistName,setPlaylistName] = useState('My Playlist');
  const [selectedTracks,setSelectedTracks] = useState([]);
  const [playlistId, setPlaylistId] = useState('')
  console.log(selectedTracks)
  // Login function
  

  // Logout handler
  function handleLogout() {
    setToken('');
    localStorage.removeItem('spotifyToken');
    window.location.hash = '';
  }

  // Get token from URL or localStorage
  useEffect(() => {
    const url = window.location.hash.substring(1);
    const params = new URLSearchParams(url);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      localStorage.setItem('spotifyToken', accessToken);
      setToken(accessToken);
    } else {
      const storedToken = localStorage.getItem('spotifyToken');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []);
 

  // SearchBar Component
 
  return (
    <div>
      {token ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <SearchBar token={token} search={search} setSearch={setSearch} setTracks={setTracks} />
          <Track tracks={tracks} setSelectedTracks={setSelectedTracks} selectedTracks={selectedTracks}/>
          <CreatePlaylist setPlaylistName={setPlaylistName} token={token} playlistName={playlistName} setSelectedTracks={setSelectedTracks} selectedTracks={selectedTracks}/>
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;

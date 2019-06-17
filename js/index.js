document.addEventListener('DOMContentLoaded', function() {
    //close the modal
    document.querySelectorAll(".close-mod").forEach(el =>{
        el.addEventListener("click",function(e){
            document.querySelector("#dialog").classList.remove("show")
        })
    })

    //user id, if void, user is not logged
    var userId = ""

   // var currentDoc = null
    //init firebase
    try {
      let app = firebase.app();
      let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] === 'function');
      document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    } catch (e) {
      console.error(e);
      document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    //check if user is logged
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("the user is logged in")
            console.log(user.uid)
            userId = user.uid
            var logButt = document.querySelector("#login")
            logButt.innerHTML = "LogOut"
            logButt.removeEventListener("click",handleLogin)
            logButt.addEventListener("click",handleLogout)
        } else {
            console.log("the user is NOT logged in") 
            var logButt = document.querySelector("#login")
            logButt.innerHTML = "LogIn"
            logButt.removeEventListener("click",handleLogout)
            logButt.addEventListener("click",handleLogin)       
        }
    });
    
    //get the result of google login throw redirect
    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            console.log(result.credential)
            
          // This gives you a Google Access Token. You can use it to access the Google API.
          accessToken = result.credential.accessToken;
          // ...
        }
        // The signed-in user info.
        var user = result.user;
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
    
    //get data in a recursive way + set listeners like n dislike
    getData(100000)




    //apply listener to send data
    document.querySelector("#send").addEventListener("click",function(e){
        var user = firebase.auth().currentUser;
        if(!user){
            console.log("cant post if not logged")
            document.querySelector("#dialog").classList.add("show")
            document.querySelector(".modal-body p").innerHTML = "cant post if not logged"
            return
        }
        var thing = document.querySelector("#new-thing").value
        if (thing == ""){
            return
        }
        document.querySelector("#new-thing").value = ""
        var rand = Math.round(Math.random() * 100000)
        console.log(rand)
        firebase.firestore().collection('Things').add({
            Dislikes:0,
            Likes:0,
            Random:rand,
            Thing:thing,
            Uid:userId
        })
        .then(function(ref){
            console.log("sent successfully")
            document.querySelector("#dialog").classList.add("show")
            document.querySelector(".modal-body p").innerHTML = "successfully sent new thing"
        })
        .catch(function(e){
            console.log(e)
            document.querySelector("#dialog").classList.add("show")
            document.querySelector(".modal-body p").innerHTML = "error sending new thing"
        })
    })
    
});
  
function handleLogin(e){
    console.log("handling login...")
    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithRedirect(provider);
    /*firebase.auth().signInAnonymously().catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
      });*/
   
}
function handleLogout(e){
    firebase.auth().signOut().then(function() {
        console.log("logout successful")
    }).catch(function(error) {
        // An error happened.
      });
}

//ALERT this function is recursive! 
//fetch data from docs, and updates listeners for likes
function getData(top){
    var rand = Math.round(Math.random() * top)
        //get data from firestore and inject it in document
        firebase.firestore().collection('Things').where('Random', '>=', rand)
        .orderBy("Random")
        .limit(1)
        .get()
        .then(function(querySnapshot) {
            if (querySnapshot.size > 0) {
                // Contents of first document
                data = querySnapshot.docs[0].data()
                //console.log(querySnapshot.docs[0].ref)
                var currentDoc = querySnapshot.docs[0].ref
                //console.log(currentDoc)
                //console.log(data);
                document.querySelector("#userId").innerHTML = data.Uid
                document.querySelector("#thing").innerHTML = data.Thing
                document.querySelector("#n-like").innerHTML = data.Likes
                document.querySelector("#n-dislike").innerHTML = data.Dislikes

                var remLikeEvents = function(){
                    document.querySelector("#like").removeEventListener("click",likeEv)
                    document.querySelector("#dislike").removeEventListener("click",dislikeEv)
                    document.querySelector("#next").removeEventListener("click",nextEv)

                }
                //event to send like
                var likeEv = function(e){
                    var user = firebase.auth().currentUser;
                    if(!user){
                        console.log("cant like if not logged")
                        document.querySelector("#dialog").classList.add("show")
                        document.querySelector(".modal-body p").innerHTML = "cant like if not logged"
                        return
                    }
                    if(currentDoc == null){
                        console.log("data not ready")
                    }
                    console.log(currentDoc)
                    const increment = firebase.firestore.FieldValue.increment(1);
                    currentDoc.update({Likes:increment})
                    remLikeEvents()
                    getData(100000)
                }
                //function to remove the event when new document is loaded

                document.querySelector("#like").addEventListener("click",likeEv)

                //event to send dislike
                var dislikeEv = function(e){
                    var user = firebase.auth().currentUser;
                    if(!user){
                        console.log("cant dislike if not logged")
                        document.querySelector("#dialog").classList.add("show")
                        document.querySelector(".modal-body p").innerHTML = "cant dislike if not logged"
                        return
                    }
                    if(currentDoc == null){
                        console.log("data not ready")
                    }
                    console.log(currentDoc)
                    const increment = firebase.firestore.FieldValue.increment(1);
                    currentDoc.update({Dislikes:increment})
                    remLikeEvents()
                    getData(100000)
                }

                document.querySelector("#dislike").addEventListener("click",dislikeEv)

                var nextEv = function(e){
                    remLikeEvents()
                    getData(100000)
                }
                //set listener to get next document
                document.querySelector("#next").addEventListener("click",nextEv)
                
    
            } else {
                console.log("No such document!");
                getData(rand/2)
            }
        })
        .catch(function(error) {
        console.log("Error getting document: ", error);
        });
}
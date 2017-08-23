/**
 * Created by Harbin on 6/13/17.
 */
/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

function medicine() {
    this.checkSetup();

    // var user = firebase.auth().currentUser.uid;

    // this.userID = window.location.hash.substring(1);

    // console.log(this.token);
    this.userID = window.location.hash.substring(1);

    // console.log(key);

    // Shortcuts to DOM Elements.
    this.messageList = document.getElementById('messages');
    // this.messageForm = document.getElementById('message-form');
    // this.messageInput = document.getElementById('message');
    // this.submitButton = document.getElementById('submit');
    // this.submitImageButton = document.getElementById('submitImage');
    // this.imageForm = document.getElementById('image-form');
    this.mediaCapture = document.getElementById('mediaCapture');
    this.userPic = document.getElementById('user-pic');
    this.userName = document.getElementById('user-name');
    this.signInButton = document.getElementById('sign-in');
    this.signOutButton = document.getElementById('sign-out');
    this.signInSnackbar = document.getElementById('must-signin-snackbar');

    this.refreshButton = document.getElementById('refresh');


    this.addButton = document.getElementById('add');
    this.medicineName = document.getElementById('et-medicine-name');
    this.medicineStrength = document.getElementById('et-medicine-strength');
    this.medicineDuration = document.getElementById('et-medicine-duration');
    this.medicinePeriod = document.getElementById('et-medicine-period');
    this.medicineTime = document.getElementById('et-medicine-time');

    // Saves message on form submit.
    // this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    // this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.addButton.addEventListener('click', this.saveMedicine.bind(this));

    this.refreshButton.addEventListener('click', this.loadEaten.bind(this));
    // Toggle for the button.
    // var buttonTogglingHandler = this.toggleButton.bind(this);
    // this.messageInput.addEventListener('keyup', buttonTogglingHandler);
    // this.messageInput.addEventListener('change', buttonTogglingHandler);
    this.initFirebase();


}

// Sets up shortcuts to Firebase features and initiate firebase auth.
medicine.prototype.initFirebase = function() {
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};


medicine.prototype.loadEaten = function() {
    this.eatenRef = this.database.ref('/users/' + this.userID + '/reminders/eaten');


    var setEatenInfo = function(data){
        var val = data.val();
        console.log(val);
        // console.log(data.key);
        var medicineDiv = document.getElementById(data.key);
        // console.log(medicineDiv);


        var eaten = "";
        for (var i = 0; i < val.length; i++){
            if (val[i]==-1){
                eaten += "N ";
            }else if (val[i] == 1){
                eaten += "Y ";
            }
        }


        medicineDiv.querySelector('.medicine-eaten').textContent = eaten;
    }.bind(this);

    this.eatenRef.on('child_added', setEatenInfo);
    this.eatenRef.on('child_changed', setEatenInfo);
}


// Loads chat messages history and listens for upcoming ones.
medicine.prototype.loadMessages = function() {


    this.medicineRef = this.database.ref('/users/' + this.userID + '/reminders/info');

    var setMedicineInfo = function (data){
        var val = data.val();
        this.dispayMedicineInfo(data.key, val.strength, val.duration, val.period, val.time);
    }.bind(this);


    this.medicineRef.on('child_added', setMedicineInfo);
    this.medicineRef.on('child_changed', setMedicineInfo);
    // this.medicineRef.on('child_removed', setMedicineInfo);

};


medicine.prototype.dispayMedicineInfo = function (key, strength, duration, period, time) {

    var div = document.getElementById(key);
    if(!div){
        var container = document.createElement('div');
        container.innerHTML = medicine.MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        this.messageList.appendChild(div);
    }



    // console.log(eaten);

    div.querySelector('.medicine-name').textContent = key;
    div.querySelector('.medicine-strength').textContent = strength;
    div.querySelector('.medicine-duration').textContent = duration;
    div.querySelector('.medicine-period').textContent = period;
    div.querySelector('.medicine-time').textContent = time;
    // div.querySelector('.medicine-eaten').textContent = eaten;
    div.querySelector('.medicine-delete').setAttribute('id', key+'_delete');
    div.querySelector('.medicine-delete').textContent = "delete";
    div.querySelector('.medicine-modify').textContent = "modify";
    div.querySelector('.medicine-modify').setAttribute('id', key+'_modify');

    var self = this;

    div.querySelector('.medicine-delete').addEventListener("click", function(){

       firebase.database().ref('/users/' + self.userID + '/reminders/info').child(key).remove();
       firebase.database().ref('/users/' + self.userID + '/reminders/eaten').child(key).remove();

       div.remove();
    });


    div.querySelector('.medicine-modify').addEventListener("click", function(){


        var div_edit = document.getElementById(key);
        var container = document.createElement('div');
        container.innerHTML = medicine.MEDICINE_MODIFY_TEMPLATE;
        div_edit = container.firstChild;
        div_edit.setAttribute('id', key);
        div_edit.querySelector('.medicine-name').textContent = key;
        div_edit.querySelector('.medicine-strength').setAttribute("value", strength);
        div_edit.querySelector('.medicine-duration').setAttribute("value", duration);
        div_edit.querySelector('.medicine-period').setAttribute("value", period);
        div_edit.querySelector('.medicine-time').setAttribute("value", time);
        div_edit.querySelector('.medicine-delete').setAttribute('id', key+'_ok');
        div_edit.querySelector('.medicine-delete').textContent = "ok";
        div_edit.querySelector('.medicine-modify').textContent = "cancel";
        div_edit.querySelector('.medicine-modify').setAttribute('id', key+'_cancel');


        div_edit.querySelector('.medicine-delete').addEventListener("click", function(){
            var medicine = div_edit.querySelector('.medicine-name').textContent;
            var strength = div_edit.querySelector('.medicine-strength').value;
            var duration = div_edit.querySelector('.medicine-duration').value;
            var period = div_edit.querySelector('.medicine-period').value;
            var time = div_edit.querySelector('.medicine-time').value;

            if (strength && duration && period && time && self.checkSignedInWithMessage()){
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth()+1; //January is 0!
                var yyyy = today.getFullYear();

                console.log("in", duration);

                if(dd<10) {
                    dd = '0'+dd
                }

                if(mm<10) {
                    mm = '0'+mm
                }

                today = yyyy + '-' + mm + '-' + dd;
                self.database.ref('/users/' + self.userID + '/reminders/info/' + medicine).update({
                    duration:parseInt(duration),
                    medicine:medicine,
                    period:parseInt(period),
                    time:time,
                    strength:strength,
                    startTime:today
                }).catch(function (error) {
                    console.error('Error writing new medicine to Firebase Database', error);
                });


                div.querySelector('.medicine-strength').textContent = strength;
                div.querySelector('.medicine-duration').textContent = duration;
                div.querySelector('.medicine-period').textContent = period;
                div.querySelector('.medicine-time').textContent = time;


                self.messageList.replaceChild(div, div_edit);
            }
        });

        div_edit.querySelector('.medicine-modify').addEventListener("click", function(){
            self.messageList.replaceChild(div, div_edit);
        });


        self.messageList.replaceChild(div_edit, div);


    });

    // var messageElement = div.querySelector('.message');
    //
    // messageElement.textContent = firstname + ' ' + lastname;
    // messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    // messageElement.href = "html/medicine.html#"+key;

    // setTimeout(function () {
    //     div.classList.add('visible')
    // }, 1);
    // this.messageList.scrollTop = this.messageList.scrollHeight;
    // this.messageInput.focus();
};



// Saves a new message on the Firebase DB.
medicine.prototype.saveMessage = function(e) {
    e.preventDefault();
    // Check that the user entered a message and is signed in.
    if (this.messageInput.value && this.checkSignedInWithMessage()) {
        var currentUser = this.auth.currentUser;
        // Add a new message entry to the Firebase Database.
        this.messagesRef.push({
            name: currentUser.displayName,
            text: this.messageInput.value,
            photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
        }).then(function() {
            // Clear message text field and SEND button state.
            medicine.resetMaterialTextfield(this.messageInput);
            this.toggleButton();
        }.bind(this)).catch(function(error) {
            console.error('Error writing new message to Firebase Database', error);
        });
    }
};

medicine.prototype.saveMedicine = function (e) {
    e.preventDefault();
    if(this.medicineName.value && this.medicineStrength.value && this.medicineDuration.value &&
            this.medicinePeriod.value && this.medicineTime.value && this.checkSignedInWithMessage()){
        // console.log('ok');

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
            dd = '0'+dd
        }

        if(mm<10) {
            mm = '0'+mm
        }

        today = yyyy + '-' + mm + '-' + dd;

        var eaten_queue = [];
        for(var i = 0; i < 7; i++){
            eaten_queue.push(-1);
        }

        this.database.ref('/users/' + this.userID + '/reminders/info/' + this.medicineName.value).set({
            duration:parseInt(this.medicineDuration.value),
            medicine:this.medicineName.value,
            period:parseInt(this.medicinePeriod.value),
            time:this.medicineTime.value,
            strength:this.medicineStrength.value,
            alarmId:this.curtID,
            sync:false,
            startTime:today
            // eatenLog:eaten_queue
        }).then(function () {
            this.database.ref('/users/' + this.userID).update({
                curtID:this.curtID+10
            });
        }.bind(this)).catch(function (error) {
            console.error('Error writing new medicine to Firebase Database', error);
        });



        this.database.ref('users/' + this.userID + '/reminders/eaten/' + this.medicineName.value).set({
            0:-1,
            1:-1,
            2:-1,
            3:-1,
            4:-1,
            5:-1,
            6:-1
        }).catch(function (error) {
            console.error('Error writing new medicine to Firebase Database', error)
        });


    }
}


// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
medicine.prototype.setImageUrl = function(imageUri, imgElement) {
    // If the image is a Cloud Storage URI we fetch the URL.
    if (imageUri.startsWith('gs://')) {
        imgElement.src = medicine.LOADING_IMAGE_URL; // Display a loading image first.
        this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
            imgElement.src = metadata.downloadURLs[0];
        });
    } else {
        imgElement.src = imageUri;
    }
};


// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
medicine.prototype.saveImageMessage = function(event) {
    event.preventDefault();
    var file = event.target.files[0];

    // Clear the selection in the file picker input.
    // this.imageForm.reset();

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        var data = {
            message: 'You can only share images',
            timeout: 2000
        };
        this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
        return;
    }
    // Check if the user is signed-in
    if (this.checkSignedInWithMessage()) {

        // We add a message with a loading icon that will get updated with the shared image.
        var currentUser = this.auth.currentUser;
        this.messagesRef.push({
            name: currentUser.displayName,
            imageUrl: medicine.LOADING_IMAGE_URL,
            photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
        }).then(function(data) {

            // Upload the image to Cloud Storage.
            var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
            return this.storage.ref(filePath).put(file).then(function(snapshot) {

                // Get the file's Storage URI and update the chat message placeholder.
                var fullPath = snapshot.metadata.fullPath;
                return data.update({imageUrl: this.storage.ref(fullPath).toString()});
            }.bind(this));
        }.bind(this)).catch(function(error) {
            console.error('There was an error uploading a file to Cloud Storage:', error);
        });
    }
};


// Signs-in Friendly Chat.
medicine.prototype.signIn = function() {

};


// Signs-out of Friendly Chat.
medicine.prototype.signOut = function() {
    this.auth.signOut();
};


// Triggers when the auth state change for instance when the user signs-in or signs-out.
medicine.prototype.onAuthStateChanged = function(user) {
    if (user) { // User is signed in!
        // Get profile pic and user's name from the Firebase user object.
        var profilePicUrl = user.photoUrl;   // TODO(DEVELOPER): Get profile pic.
        var userName = user.userName;        // TODO(DEVELOPER): Get user's name.


        this.curtIDRef = this.database.ref('/users/' + this.userID + '/curtID');
        var self = this;
        this.curtIDRef.on('value', function(snapshot){
            self.curtID = snapshot.val();
        });


        // Set the user's profile pic and name.
        this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
        this.userName.textContent = userName;

        // Show user's profile and sign-out button.
        this.userName.removeAttribute('hidden');
        this.userPic.removeAttribute('hidden');
        this.signOutButton.removeAttribute('hidden');

        // Hide sign-in button.
        this.signInButton.setAttribute('hidden', 'true');

        // We load currently existing chant messages.
        this.loadMessages();


        // this.loadEaten();

        // We save the Firebase Messaging Device token and enable notifications.
        this.saveMessagingDeviceToken();


    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        this.userName.setAttribute('hidden', 'true');
        this.userPic.setAttribute('hidden', 'true');
        this.signOutButton.setAttribute('hidden', 'true');

        // Show sign-in button.
        this.signInButton.removeAttribute('hidden');
    }
};


// Returns true if user is signed-in. Otherwise false and displays a message.
medicine.prototype.checkSignedInWithMessage = function() {
    /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
    if(this.auth.currentUser){
        return true;
    }

    // Display a message to the user using a Toast.
    var data = {
        message: 'You must sign-in first',
        timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return false;
};

// Saves the messaging device token to the datastore.
medicine.prototype.saveMessagingDeviceToken = function() {
    // TODO(DEVELOPER): Save the device token in the realtime datastore
};

// Requests permissions to show notifications.
medicine.prototype.requestNotificationsPermissions = function() {
    // TODO(DEVELOPER): Request permissions to send notifications.
};

// Resets the given MaterialTextField.
medicine.resetMaterialTextfield = function(element) {
    element.value = '';
    element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
medicine.MESSAGE_TEMPLATE =
    '<div class="medicine-container">' +
    '<div class="medicine-name"></div>' +
    '<div  class="medicine-strength"></div>' +
    '<div class="medicine-duration"></div>' +
    '<div class="medicine-period"></div>' +
    '<div class="medicine-time"></div>' +
    '<div class="medicine-eaten">Need Refresh</div>' +
    '<button class="medicine-delete"></button>' +
    '<button class="medicine-modify"></button>'
    '</div>' +
    '<br class="after-box"/>' +
    '<br class="after-box"/>';

medicine.MEDICINE_MODIFY_TEMPLATE =
    '<div class="medicine-container">' +
    '<div class="medicine-name"></div>' +
    '<input type="text" class="medicine-strength"></input>' +
    '<input type="text" class="medicine-duration"></input>' +
    '<input type="text" class="medicine-period"></input>' +
    '<input type="text" class="medicine-time"></input>' +
    '<button class="medicine-delete"></button>' +
    '<button class="medicine-modify"></button>'
    '</div>' +
    '<br class="after-box"/>' +
    '<br class="after-box"/>';


// medicine.MESSAGE_TEMPLATE =
//     '<div class="medicine-container">' +
//     '<div class="inline"></div>' +
//     '<div class="inline"></div>' +
//     '<div class="inline"></div>' +
//     '<div class="inline"></div>' +
//     '<div class="inline"></div>' +
//     '</div>' +
//     '<br class="after-box"/>';

// A loading image URL.
medicine.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

medicine.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
    var div = document.getElementById(key);
    // If an element for that message does not exists yet we create it.
    if (!div) {
        var container = document.createElement('div');
        container.innerHTML = medicine.MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        this.messageList.appendChild(div);
    }
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
    }
    div.querySelector('.name').textContent = name;
    var messageElement = div.querySelector('.message');
    if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUri) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function() {
            this.messageList.scrollTop = this.messageList.scrollHeight;
        }.bind(this));
        this.setImageUrl(imageUri, image);
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }
    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() {div.classList.add('visible')}, 1);
    this.messageList.scrollTop = this.messageList.scrollHeight;
    this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
medicine.prototype.toggleButton = function() {
    if (this.messageInput.value) {
        this.submitButton.removeAttribute('disabled');
    } else {
        this.submitButton.setAttribute('disabled', 'true');
    }
};

// Checks that the Firebase SDK has been correctly setup and configured.
medicine.prototype.checkSetup = function() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
        window.alert('You have not configured and imported the Firebase SDK. ' +
            'Make sure you go through the codelab setup instructions and make ' +
            'sure you are running the codelab using `firebase serve`');
    }
};

window.onload = function() {
    window.nova = new medicine();
};

const { admin, db } = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');


//Signup Function

exports.signup = (req, res) => {
    
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };
    
    const { valid, errors } = validateSignupData(newUser);
    if(!valid) return res.status(400).json(errors);

    const noImg = 'no-img.png';

    let token, userId;
    db.doc(`/users/${newUser.handle}`).get().then(doc => {
        if(doc.exists){
            return res.status(400).json({handle: ' this handle is already taken'});
        }else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    }).then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    }).then(idToken => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId: userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    }).then(() => {
        return res.status(201).json({ token });
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({ email: 'Email is already in use'});
        }
        else{
            return res.status(500).json({ general: 'Something went wrong. Please try Again'});
        }
    });
}

//Login Function

exports.login = (req, res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    };
    const { valid, errors } = validateLoginData(user);
    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(data => {
        return data.user.getIdToken();
    }).then(token => {
        return res.json({token});
    }).catch(err => {
        console.error(err);
        if(err.code === 'auth/wrong-password') {
            return res.status(403).json({ general: 'Wrong Credentials. Please try again.'});
        } else return res.status(500).json({general: err.code});
    })
};

//User Details Upload Function
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails).then(() => {
        return res.json({message: 'Profile Updated Successfully '});
    }).catch(err => {
        console.log(err);
        return res.status(500).json({ error: err.code });
    })
};

//Get any Users Details

exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`).get().then(doc => {
        if(doc.exists) {
            userData.user = doc.data();
            return db.collection('screams').where('userHandle', '==', req.params.handle).orderBy('createdAt', 'desc').get();
        }else{
            return res.status(404).json({ error: "user Doesnt Exists"});
        }
    }).then(data => {
        userData.screams = [];
        data.forEach(doc => {
            userData.screams.push({
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                screamId: doc.id
                
            });
        });
        return res.json(userData);
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
};

//Get own User Details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get().then(doc => {
        if(doc.exists) {
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle', '==', req.user.handle).get();
        }
    }).then(data => {
        userData.likes = [];
        data.forEach( doc => {
            userData.likes.push(doc.data());
        });
        return db.collection('notifications').where('recepient', '==', req.user.handle).orderBy('createdAt', 'desc').limit(15).get();
    }).then(data => {
        userData.notifications = [];
        data.forEach(doc => {
            userData.notifications.push({
                recepient: doc.data().recepient,
                sender: doc.data().sender,
                createdAt: doc.data().createdAt,
                screamId: doc.data().screamId,
                senderImage: doc.data().senderImage,
                type: doc.data().type,
                read: doc.data().read,
                notificationId: doc.id
            })
        });
        return res.json(userData);
    }).catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
};



//New User Image Uplaod Function
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    
    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if( !mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'File is not an image. Please check '});
        }
        //getting fileExtension
        const imageExtension = filename.split('.')[filename.split('.').length -1];
        //generating random filename for image
        imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtension}`;
        //getting filepath
        const filepath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = { filepath, mimetype };
        //creating file to upload
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        }).then(() => {
            return res.json({ message: 'Image uploaded Successfully'});
        }).catch(err => {
            console.error(err);
            return res.status(500).json({ error : err.code});
        });
    });
    busboy.end(req.rawBody);
};

// Marks Notifications as read

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {read: true});
    });
    batch.commit().then(() => {
        return res.json({message: "Notifications marked read successfully" });
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}
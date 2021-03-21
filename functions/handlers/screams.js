const { response } = require('express');
const { db } = require('../util/admin');

exports.getAllScreams = (req, res) => {
    db.collection('screams').orderBy('createdAt', 'desc').get().then((data) => {
        let screams= [];
        data.forEach((doc) => {
            screams.push({
                screamId : doc.id,
                body : doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                userImage: doc.data().userImage,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount
            });
        });
        return res.json(screams);
    }).catch((err) => console.error(err));
};


// Post Image Upload
// const postWithImage = (req, res) => {
//     const BusBoy = require('busboy');
//     const path = require('path');
//     const os = require('os');
//     const fs = require('fs');
    
//     const busboy = new BusBoy({ headers: req.headers });

//     let imageFileName;
//     let imageToBeUploaded = {};

//     busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
//         if( !mimetype.startsWith('image/')) {
//             return res.status(400).json({ error: 'File is not an image. Please check '});
//         }
//         //getting fileExtension
//         const imageExtension = filename.split('.')[filename.split('.').length -1];
//         //generating random filename for image
//         imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtension}`;
//         //getting filepath
//         const filepath = path.join(os.tmpdir(), imageFileName);

//         imageToBeUploaded = { filepath, mimetype };
//         //creating file to upload
//         file.pipe(fs.createWriteStream(filepath));
//     });
//     busboy.on('finish', () => {
//         admin.storage().bucket().upload(imageToBeUploaded.filepath, {
//             resumable: false,
//             metadata: {
//                 metadata:{
//                     contentType: imageToBeUploaded.mimetype
//                 }
//             }
//         })
//         .then(() => {
//             const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
//             return db.doc(`/scream/${req.user.handle}`).update({ postImageUrl });
//         }).then(() => {
//             return res.json({ message: 'Image uploaded Successfully'});
//         }).catch(err => {
//             console.error(err);
//             return res.status(500).json({ error : err.code});
//         });
//     });
//     busboy.end(req.rawBody);
// };


exports.postOneScream = (req, res) => {
    // let request = req;
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty' });
    }
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    };
    db.collection('screams').add(newScream).then(doc => {
        const resScream = newScream;
        resScream.screamId = doc.id;
        // res.json({message : `document ${doc.id} created successfully`});
        res.json({resScream});
    })
    .catch(err => {
        res.status(500).json({ error : "something went wrong"});
    })
};

exports.getScream = (req, res) => {
    let postData = {};
    db.doc(`/screams/${req.params.screamId}`).get().then(doc => {
        if(!doc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }
        else {
            postData = doc.data();
        }
        postData.screamId = doc.id;
        return db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', req.params.screamId ).get();
    }).then((doc) => {
        postData.comments = [];
        doc.forEach((tile) => {
            postData.comments.push(tile.data());
        });
        return res.json(postData);
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    });
};


// Function to Comment on Post 
exports.commentOnPost = (req, res) => {
    if(!req.body.body === '') {
        return res.json({ comment: 'Comment cannot be Empty' });
    }
    let commentData = {
        body: req.body.body,
        userHandle: req.user.handle,
        screamId: req.params.screamId,
        createdAt: new Date().toISOString(),
        userImage: req.user.imageUrl
    };
    db.doc(`/screams/${req.params.screamId}`).get().then((doc) => {
        if(!doc.exists){
            return res.status(404).json({messsage: 'Post not found' });
        }// Increasing the comment count
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    }).then(() => {
        db.collection('comments').add(commentData);
    })
    .then(() => {
        return res.json(commentData);
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
};

// Like a Post.

exports.likePost = (req, res) => {
    const likeDoc = db.collection('likes').where('userHandle', '==', req.user.handle).where('screamId', '==', req.params.screamId).limit(1);
    const postDocument = db.doc(`/screams/${req.params.screamId}`);

    let postData;
    postDocument.get().then((doc) => {
        if(doc.exists) {
            postData = doc.data();
            postData.screamId = doc.id;
            return likeDoc.get();
        }
        else {
            return res.status(404).json({error: "Post not Found" });
        }
    }).then((data) => {
        if(data.empty) {
            let addLike = {
                screamId: req.params.screamId,
                userHandle: req.user.handle
            }
            return db.collection('likes').add(addLike).then(() => {
                postData.likeCount++;
                return postDocument.update({likeCount:postData.likeCount});
            }).then(() => {
                return res.json(postData);
            })
        }else {
            return res.status(400).json({ message: "You've already liked the post" })
        }
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ error : err.code});
    })
};

// Unlike a Post.

exports.unlikePost = (req, res) => {
    const likeDoc = db.collection('likes').where('userHandle', '==', req.user.handle).where('screamId', '==', req.params.screamId).limit(1);
    const postDocument = db.doc(`/screams/${req.params.screamId}`);

    let postData;
    postDocument.get().then((doc) => {
        if(doc.exists) {
            postData = doc.data();
            postData.screamId = doc.id;
            return likeDoc.get();
        }
        else {
            return res.status(404).json({error: "Post not Found" });
        }
    }).then((data) => {
        if(data.empty) {
            return res.json({ message: "Cannot unlike the post" })
        }else {
            return db.doc(`/likes/${data.docs[0].id}`).delete().then(() => {
                postData.likeCount--;
                return postDocument.update({likeCount:postData.likeCount});
            }).then(() => {
                return res.json(postData);
            })
        }
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ error : err.code});
    })
};

exports.deletePost = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get().then((doc) => {
        if(!doc.exists) {
            return res.status(404).json({message: "post not found"});
        }
        if(doc.data().userHandle !== req.user.handle) {
            return res.status(403).json({message: "Not Authorized" });
        }else{
            return document.delete();
        }
    }).then(() => {
        res.json({message: "post Deleted Successfully"});
    }).catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code });
    })
};

exports.notifyOnLikeOrComment = (req, res) => {

};
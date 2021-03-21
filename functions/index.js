const functions = require("firebase-functions");

const express = require("express");
const app = express();
const cors = require("cors");

const FireBaseAuth = require("./util/fireBaseAuth");

const { db } = require("./util/admin");

const {
	getAllScreams,
	postOneScream,
	getScream,
	commentOnPost,
	likePost,
	unlikePost,
	deletePost,
	notifyOnLikeOrComment,
} = require("./handlers/screams");
const {
	signup,
	login,
	uploadImage,
	addUserDetails,
	getAuthenticatedUser,
	getUserDetails,
	markNotificationsRead,
} = require("./handlers/users");

app.use(cors());

//Scream route from handlers file
app.get("/screams", getAllScreams);
app.post("/scream", FireBaseAuth, postOneScream);
app.get("/scream/:screamId", getScream);

// ToDo delete a post.
app.delete("/scream/:screamId", FireBaseAuth, deletePost);
// TODO like a post.
app.get("/scream/:screamId/like", FireBaseAuth, likePost);
// unlike a post.
app.get("/scream/:screamId/unlike", FireBaseAuth, unlikePost);
//comment on a post.
app.post("/scream/:screamId/comment", FireBaseAuth, commentOnPost);

/*      User Routes      */
//Image Uplaod route
app.post("/user/image", FireBaseAuth, uploadImage);
//User Details Upload Route
app.post("/user", FireBaseAuth, addUserDetails);
// get User Details for logged in user
app.get("/user", FireBaseAuth, getAuthenticatedUser);
//get details of another users
app.get("/user/:handle", getUserDetails);
//Mark Notifications as read route
app.post("/notifications", FireBaseAuth, markNotificationsRead);

//signup & login route
app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.notifyOnLike = functions.firestore
	.document("likes/{id}")
	.onCreate((snapshot) => {
		return db
			.doc(`screams/${snapshot.data().screamId}`)
			.get()
			.then((doc) => {
				if (
					doc.exists &&
					doc.data().userHandle !== snapshot.data().userHandle
				) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recepient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						senderImage: snapshot.data().userImage,
						type: "like",
						read: false,
						screamId: doc.id,
					});
				}
			})
			.catch((err) => console.error(err));
	});

exports.deleteNotificationOnUnlike = functions.firestore
	.document("likes/{id}")
	.onDelete((snapshot) => {
		return db
			.doc(`/notifications/${snapshot.id}`)
			.delete()
			.catch((err) => {
				console.error(err);
				return;
			});
	});

exports.notifyOnComment = functions.firestore
	.document("comments/{id}")
	.onCreate((snapshot) => {
		return db
			.doc(`screams/${snapshot.data().screamId}`)
			.get()
			.then((doc) => {
				if (
					doc.exists &&
					doc.data().userHandle !== snapshot.data().userHandle
				) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recepient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						senderImage: snapshot.data().userImage,
						type: "comment",
						read: false,
						screamId: doc.id,
					});
				}
			})
			.catch((err) => {
				console.error(err);
				return;
			});
	});

//Trigger to change the image Url for all post submitted by user if user changes their profile pic.
exports.onUserImageUpdate = functions.firestore
	.document("/user/{userId}")
	.onUpdate((change) => {
		console.log(change.before.data());
		console.log(change.after.data());

		if (change.before.data().imageurl !== change.after.data().imageurl) {
			console.log("UserImage changed");
			let batch = db.batch();
			return db
				.collection("screams")
				.where("userHandle", "==", change.before.data().handle)
				.get()
				.then((data) => {
					data.forEach((doc) => {
						const scream = db.collection(`/screams/${doc.id}`);
						batch.update(scream, { imageUrl: change.after.data().imageUrl });
					});
					return batch.commit();
				});
		} else return true;
	});

//Delete everything related to post if a post is deleted
exports.onPostDeleted = functions.firestore
	.document("screams/{screamId}")
	.onDelete((snapshot, context) => {
		const screamId = context.params.screamId;
		const batch = db.batch();
		return db
			.collection("comments")
			.where("screamId", "==", screamId)
			.get()
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/comments/${doc.id}`));
				});
				return db.collection("likes").where("screamId", "==", screamId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/likes/${doc.id}`));
				});
				return db
					.collection("notifications")
					.where("screamId", "==", screamId)
					.get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/notifications/${doc.id}`));
				});
				return batch.commit();
			})
			.catch((err) => console.error(err));
	});

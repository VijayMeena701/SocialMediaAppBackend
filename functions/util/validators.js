const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
};

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9{1,3}\.[0-9]{1,3}\]])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
};

exports.validateSignupData = (data) => { 
    let errors ={};
    // Data Validation
    if(isEmpty(data.email)) {
        errors.email = 'Must not be Empty'
    }else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email address'
    }
    if(isEmpty(data.password)) {
        errors.password = 'Must not be Empty'
    }
    if(data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not Match'
    }
    if(isEmpty(data.handle)) {
        errors.handle = 'Must not be Empty'
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
};

exports.validateLoginData = (data) => {
    let errors = {};
    if(!isEmail(data.email)){
        errors.email = 'Must be a valid email address'
    }
    if(isEmpty(data.password)) {
        errors.password = 'Must not be Empty'
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
};

exports.reduceUserDetails = (userData) => {
    let userDetails = {};
    if(!isEmpty(userData.bio.trim())) userDetails.bio = userData.bio;  // if bio is not empty then add bio.
    if(!isEmpty(userData.phone.trim())) userDetails.phone = userData.phone; // Same for all other cases
    if(!isEmpty(userData.school.trim())) userDetails.school = userData.school;
    if(!isEmpty(userData.university.trim())) userDetails.university = userData.university;
    if(!isEmpty(userData.currentlyStaysAt.trim())) userDetails.currentlyStaysAt = userData.currentlyStaysAt;
    if(!isEmpty(userData.relationshipStatus.trim())) userDetails.relationshipStatus = userData.relationshipStatus;
    if(!isEmpty(userData.instagramProfile.trim())) userDetails.instagramProfile = userData.instagramProfile;
    if(!isEmpty(userData.facebookProfile.trim())) userDetails.facebookProfile = userData.facebookProfile;
    if(!isEmpty(userData.twitterProfile.trim())) userDetails.twitterProfile = userData.twitterProfile;
    if(!isEmpty(userData.loveInterest.trim())) userDetails.loveInterest = userData.loveInterest;
    if(!isEmpty(userData.languages.trim())) userDetails.languages = userData.languages;
    if(!isEmpty(userData.familyMembersUserId.trim())) userDetails.familyMembersUserId = userData.familyMembersUserId;
    if(!isEmpty(userData.nickName.trim())) userDetails.nickName = userData.nickName;
    if(!isEmpty(userData.birthDate.trim())) userDetails.birthDate = new Date(userData.birthDate).toISOString();
    if(!isEmpty(userData.website.trim())) {
        if(userData.website.substring(0, 4) !== "http" ) userDetails.website = `http://${userData.website.trim()}`;
        else userDetails.website = userData.website;
    }
    if(!isEmpty(userData.location.trim())) userDetails.location = userData.location;
    return userDetails;
};
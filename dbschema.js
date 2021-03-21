let db = {
    users: [{
        userId: 'Si4AFtvD6BY3iIaPT0ngimtIyJC3',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2020-11-09T12:25:56.314Z',
        imageUrl: 'image/cwhagfca/ceahfcvha.png',
        bio: 'Hello, my name is xyz, this is my bio.',
        website: 'https://user.com',
        location: 'Maharashtra, INDIA',
        phone: "number",
        school: "Gurukul",
        university: "IIITDM",
        currentlyStaysAt: "Mumbai",
        relationshipStatus: "Single",
        instagramProfile: "viju_meena",
        facebookProfile: "VijayMeena001",
        twitterProfile: "VijayMeena",
        loveInterest: "Women",
        languages: "Hindi, Marathi, English, ...",
        familyMembersUserId: "newUser",
        nickName: "Viju",
        birthDate: "2020-08-20T00:00:00.000Z",
    }],
    screams : [
        {
            userHandle: 'user',
            body : 'dummy body caption',
            createdAt: 'time created as IsoString',
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'ujhfvugijgh',
            body: 'ceiasghvciueas',
            createdAt: '2020-11-09T12:25:56.314Z'
        }
    ],
    notifications: [
        {
            reciepient: 'user',
            issuer: 'new',
            read: 'true | false ',
            screamId: 'ujhfvugijgh',
            type: 'like | comment ',
            createdAt: '2020-11-09T12:25:56.314Z'
        }
    ]
};

const userDetails = {
    //Redux
    credentials: {
        userId: '',
        email: '',
        handle: '',
        createdAt:'',
        imageUrl:'',
        bio:'',
        website:'',
        location:'',
    },
    likes : [
        {
            userHandle: '',
            screamId: '',
        },
        {
            userHandle: '',
            screamId: '',
        }
    ]
};
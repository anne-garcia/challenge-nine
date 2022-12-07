import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb+srv://admin:admin@cluster0.xgp80kf.mongodb.net/?retryWrites=true&w=majority";

const mongoClient = new MongoClient(uri);

const collections = {
    facts: null,
    breeds: null,
    users: null
}

export async function Connect() {
    // Connect to database
    await mongoClient.connect();

    // Acquire databse object
    const db = mongoClient.db("catsdb");

    // Get just the existing names.
    let collNames = await db.listCollections({}, { nameOnly: true }).toArray();
    collNames = collNames.map(({name}) => name);
    // console.log(`collNames total:`, collNames);

    // Filtering by collection names could make the upcoming name check just a little bit shorter.
    collNames.filter(name => collections[name] != undefined);
    // console.log(`collNames filtered:`, collNames);

    // Go through my set of collection names
    for(const nameKey in collections) {
        collections[nameKey] = await db.collection(nameKey);
    }
    // console.log(`collections:`, collections);

    console.log(`Database connected.`);
}

export async function IsObjectId(stringId) {
    return await ObjectId.isValid(stringId);
}

// USERS

export async function RegisterUser(reqData, hashedPassword, salt) {
    return await collections.users.insertOne({...reqData, password:hashedPassword, salt});
}

export async function GetUser(username) {
    // console.log(`Searching for user by name <${username}>`);
    const user = await collections.users.findOne({ username });
    // console.log(`Found:`, user);
    return user;
}

// BREEDS

export async function GetBreeds() {
    return await collections.breeds.find({}).toArray();
}

// Presumes to have at least 1 entry
export async function GetRandomBreed() {
    const randBreeds = await collections.breeds.aggregate([{$sample: {size:1}}]).toArray();
    return randBreeds[0];
}

export async function GetBreed(breedStringId) {
    const objectId = new ObjectId(breedStringId);
    return await collections.breeds.findOne(objectId);
}

// FACTS

export async function GetFacts() {
    return await collections.facts.find({}).toArray();
}

// Presumes to have at least 1 entry
export async function GetRandomFact() {
    const randFacts = await collections.facts.aggregate([{$sample: {size:1}}]).toArray();
    return randFacts[0];
}

export async function GetFact(factStringId) {
    const objectId = new ObjectId(factStringId);
    return await collections.facts.findOne(objectId);
}
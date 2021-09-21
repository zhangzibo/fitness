'use strict'

// database operations.
// Async operations can always fail, so these are all wrapped in try-catch blocks
// so that they will always return something
// that the calling function can use. 

module.exports = {
  // testDB: testDB,
  post_activity: post_activity,
  get_most_recent_planned_activity_in_range: get_most_recent_planned_activity_in_range,
  delete_past_activities_in_range: delete_past_activities_in_range,
  get_most_recent_entry: get_most_recent_entry,
  get_similar_activities_in_range: get_similar_activities_in_range,
  get_all: get_all,
  // get_name: get_name
}

// using a Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// our activity verifier
const act = require('./activity');

// SQL commands for ActivityTable
const insertDB = "insert into ActivityTable (userid, activity, date, amount) values (?,?,?,?)"
const getOneDB = "select * from ActivityTable where activity = ? and date = ? and userid = ?";
const allDB = "select * from ActivityTable where activity = ? and userid = ?";
const deletePrevPlannedDB = "DELETE FROM ActivityTable WHERE amount < 0 and date BETWEEN ? and ? and userid = ?";
const getMostRecentPrevPlannedDB = "SELECT rowIdNum, activity, MAX(date), amount FROM ActivityTable WHERE amount <= 0 and date BETWEEN ? and ? and userid = ?";
const getMostRecentDB = "SELECT MAX(rowIdNum), activity, date, amount FROM ActivityTable WHERE userid = ?";
const getPastWeekByActivityDB = "SELECT * FROM ActivityTable WHERE activity = ? and date BETWEEN ? and ? and userid = ? ORDER BY date ASC";
const checkProfile = "SELECT * from Profile where userid = ? and username = ?";
const insertProfile = "INSERT into Profile (userid, username) values (?,?)";
const getName = "SELECT username from Profile WHERE userid = ?";
// Testing function loads some data into DB. 
// Is called when app starts up to put fake 
// data into db for testing purposes.
// Can be removed in "production". 
// async function testDB () {
//   console.log("testDB in");
//   // for testing, always use today's date
//   const today = new Date().getTime();
  
//   // all DB commands are called using await
  
//   // empty out database - probably you don't want to do this in your program
//   await db.deleteEverything();
  
//   const MS_IN_DAY = 86400000
//   let newDate =  new Date(); // today!
//   let startDate = newDate.getTime() - 7 * MS_IN_DAY;
//   let planDate3 = newDate.getTime() - 3 * MS_IN_DAY;
//   let planDate2 = newDate.getTime() - 2 * MS_IN_DAY;
//   console.log("today:", startDate)
  
//   let dbData = [
//     {
//       type: 'walk',
//       data: Array.from({length: 8}, () => randomNumber(0,1)),
//       start: startDate
//     },
//     {
//       type: 'run',
//       data: Array.from({length: 8}, () => randomNumber(1,3)),
//       start: startDate
//     },
//     {
//       type: 'swim',
//       data: Array.from({length: 8}, () => randomNumber(30, 100, false)),
//       start: startDate
//     },
//     {
//       type: 'bike',
//       data: Array.from({length: 8}, () => randomNumber(5,10)),
//       start: startDate
//     },
//     {
//       type: 'yoga',
//       data: Array.from({length: 8}, () => randomNumber(30,120,false)),
//       start: startDate
//     },
//     {
//       type: 'soccer',
//       data: Array.from({length: 8}, () => randomNumber(120,180,false)),
//       start: startDate
//     },
//     {
//       type: 'basketball',
//       data: Array.from({length: 8}, () => randomNumber(60,120,false)),
//       start: startDate
//     },
//   ]
  
//   for(const entry of dbData) {
//     for(let i = 0 ; i < entry.data.length; i++) {
//       await db.run(insertDB,["109036113746994667727", entry.type, entry.start + i * MS_IN_DAY, entry.data[i]]);
//     }
//     console.log("Inserted inot db");
//   }
  

//   await db.run(insertDB,["109036113746994667727", "yoga", planDate2, -1]);
//   await db.run(insertDB,["109036113746994667727", "yoga", planDate3, -1]);
//   await db.run(insertDB,["109036113746994667727", "run", planDate2, -1]);

//   // some examples of getting data out of database
  
//   // look at the item we just inserted
//   let result = await db.get(getOneDB,["run",startDate, "109036113746994667727"]);
//   console.log("sample single db result",result);
  
//   // get multiple items as a list
//   result = await db.all(allDB,["walk", "109036113746994667727"]);
//   console.log("sample multiple db result",result);
// }

/**
 * Insert activity into the database
 * @param {Activity} activity 
 * @param {string} activity.activity - type of activity
 * @param {number} activity.date - ms since 1970
 * @param {float} activity.scalar - measure of activity conducted
 */
async function post_activity(activity) {
  try {
    await db.run(insertDB, act.ActivityToList(activity));
    // result = await db.all(allDB,["walk", "109036113746994667727"]);
    // console.log("result 135: ", result);
  } catch (error) {
    console.log("error", error)
  }
}


/**
 * Get the most recently planned activity that falls within the min and max 
 * date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_planned_activity_in_range(min, max, userid, username) {
  try {
    let user = await db.get(checkProfile, [userid, username]);
    console.log("line 126 ", user)

    if (user == undefined) {
      await db.run(insertProfile, [userid, username]);
      user = await db.get(checkProfile, [userid, username]);
      console.log("after adding", user)
    }
    
    let results = await db.get(getMostRecentPrevPlannedDB, [min, max, userid]);
    return (results.rowIdNum != null) ? results : null;
  }
  catch (error) {
    console.log("error", error);
    return null;
  }
}



/**
 * Get the most recently inserted activity in the database
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_entry(userid) {
  try {
    let result = await db.get(getMostRecentDB, [userid]);
    return (result['MAX(rowIdNum)'] != null) ? result : null;
  }
  catch (error) {
    console.log(error);
    return null;
  }
}


/**
 * Get all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {string} activityType - type of activity
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Array.<Activity>} similar activities
 */
async function get_similar_activities_in_range(activityType, min, max, userid) {
  try {
    let results = await db.all(getPastWeekByActivityDB, [activityType, min, max, userid]);
    return results;
  }
  catch (error) {
    console.log(error);
    return [];
  }
}


/**
 * Delete all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 */
async function delete_past_activities_in_range(min, max, userid) {
  try {
    await db.run(deletePrevPlannedDB, [min, max, userid]);
  }
  catch (error) {
    console.log(error);
  }
}

// UNORGANIZED HELPER FUNCTIONS


/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
function newUTCTime() {
  let gmtDate = new Date()
  return (new Date(gmtDate.toLocaleDateString())).getTime()
}

function randomNumber(min, max, round = true) { 
  let val =  Math.random() * (max - min) + min
  if (round) {
    return Math.round(val * 100) / 100
  } else {
    return Math.floor(val)
  }
}

// dumps whole table; useful for debugging
async function get_all(userid) {
  try {
    let results = await db.all("select * from ActivityTable where userid = ?", [userid]);
    return results;
  } 
  catch (error) {
    console.log(error);
    return [];
  }
}

// // getting the name 
// async function get_name(userid)  {
//   try {

//     let name = await db.get(getName, [userid]);
//     console.log("got name: ", name)
//     return name;
//   }
//   catch (error) {
//     console.log(error);
//     return [];
//   }
// }
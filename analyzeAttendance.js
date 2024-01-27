const fs = require('fs');
const parse = require('csv-parse');

// Function to parse the CSV file
function parseCSV(filePath, callback) {
    const data = [];
    const { parse } = require('csv-parse');
    const parser = parse({ delimiter: ',' });

    const stream = fs.createReadStream(filePath);

    stream.on('error', (err) => {
        console.error(`Error reading file: ${err.message}`);
        callback(data);
    });

    stream.pipe(parser)
        .on('data', (row) => {
            data.push(row);
        })
        .on('end', () => {
            callback(data);
        })
        .on('error', (err) => {
            console.error(`Error parsing CSV: ${err.message}`);
            // Continue processing the next row even if there's an error
        });
}

// Function to parse date and time strings to JavaScript Date object
function parseDateTime(dateTimeString) {
    // If AM or PM is not mentioned, consider it as AM
    const dateString = dateTimeString.replace(/(\d{2}:\d{2}) ([APMapm]{2})/, '$1 AM $2');
    return new Date(dateString);
}

// Function to calculate time difference between two Date objects in minutes
function calculateTimeDifference(startDateTime, endDateTime) {
    const timeDifference = endDateTime - startDateTime;
    return Math.floor(timeDifference / (1000 * 60));
}

// Function to check if an employee has worked for 7 consecutive days
function checkConsecutiveDays(attendanceData, employeeName, nameIndex, dateTimeIndex) {
    const consecutiveDaysThreshold = 7;

    for (let i = 0; i < attendanceData.length - consecutiveDaysThreshold + 1; i++) {
        let consecutiveDaysWorked = 0;

        for (let j = 0; j < consecutiveDaysThreshold; j++) {
            const currentRow = attendanceData[i + j];
            if (currentRow && currentRow[nameIndex] === employeeName) {
                consecutiveDaysWorked++;
            }
        }

        if (consecutiveDaysWorked === consecutiveDaysThreshold) {
            return true;  // Employee worked for 7 consecutive days
        }
    }

    return false;  // Employee did not work for 7 consecutive days
}

// Function to check if an employee has less than 10 hours between shifts but greater than 1 hour
function checkTimeBetweenShifts(attendanceData, employeeName, nameIndex, dateTimeIndex, hoursWorkedIndex, uniqueNames) {
    const timeThresholdLower = 60;  // 1 hour in minutes
    const timeThresholdUpper = 600; // 10 hours in minutes

    for (let i = 0; i < attendanceData.length - 1; i++) {
        const currentRow = attendanceData[i];
        const nextRow = attendanceData[i + 1];

        if (currentRow[nameIndex] === employeeName && nextRow[nameIndex] === employeeName) {
            const currentDateTime = parseDateTime(currentRow[dateTimeIndex]);
            const nextDateTime = parseDateTime(nextRow[dateTimeIndex]);
            const timeDifference = calculateTimeDifference(currentDateTime, nextDateTime);

            if (timeDifference < timeThresholdUpper && timeDifference > timeThresholdLower) {
                uniqueNames.add(employeeName);
                return;
            }
        }
    }
}

// Function to check if an employee worked for more than 14 hours in a single shift
function checkLongShifts(attendanceData, employeeName, nameIndex, dateTimeIndex, hoursWorkedIndex, uniqueNames) {
    const shiftThreshold = 840;  // 14 hours in minutes

    for (let i = 0; i < attendanceData.length; i++) {
        const currentRow = attendanceData[i];

        if (currentRow[nameIndex] === employeeName) {
            const currentDateTime = parseDateTime(currentRow[dateTimeIndex]);
            const hoursWorked = parseInt(currentRow[hoursWorkedIndex].split(':')[0], 10);
            const shiftDuration = hoursWorked * 60;  // Convert hours to minutes

            if (shiftDuration > shiftThreshold) {
                uniqueNames.add(employeeName);
                return;
            }
        }
    }
}

// Main function to analyze the attendance data
function analyzeAttendance(filePath) {
    const data = parseCSV(filePath, (data) => {
        // Assuming the first row contains headers
        const headers = data[0];
        const nameIndex = headers.indexOf('Employee Name');
        const dateTimeIndex = headers.indexOf('Time');
        const hoursWorkedIndex = headers.indexOf('Timecard Hours (as Time)');

        const attendanceData = data.slice(1);

        let totalConsecutiveDays = 0;
        let totalLessThan10Hours = 0;
        let totalLongShifts = 0;

        let uniqueNamesConsecutiveDays = new Set();
        let uniqueNamesTimeBetweenShifts = new Set();
        let uniqueNamesLongShifts = new Set();

        // Iterate through the attendance data to check conditions
        attendanceData.forEach((row) => {
            const name = row[nameIndex];

            // Implement the conditions checking functions
            if (checkConsecutiveDays(attendanceData, name, nameIndex, dateTimeIndex)) {
                uniqueNamesConsecutiveDays.add(name);
                totalConsecutiveDays++;
            }

            checkTimeBetweenShifts(attendanceData, name, nameIndex, dateTimeIndex, hoursWorkedIndex, uniqueNamesTimeBetweenShifts);
            checkLongShifts(attendanceData, name, nameIndex, dateTimeIndex, hoursWorkedIndex, uniqueNamesLongShifts);
        });

        // Display the unique names with the respective conditions met
        console.log("a) Who has worked for 7 consecutive days.");
        uniqueNamesConsecutiveDays.forEach((name) => {
            console.log(`${name} satisfied the condition.`);
        });
        console.log(`Total Employees worked for 7 consecutive days: ${totalConsecutiveDays}`);

        console.log("b) Who has less than 10 hours of time between shifts but greater than 1 hour");
        uniqueNamesTimeBetweenShifts.forEach((name) => {
            console.log(`${name} satisfied the condition.`);
        });
        console.log(`Total Employees have less than 10 hours between shifts but greater than 1 hour: ${uniqueNamesTimeBetweenShifts.size}`);

        console.log("c) Who has worked for more than 14 hours in a single shift");
        uniqueNamesLongShifts.forEach((name) => {
            console.log(`${name} satisfied the condition.`);
        });
        console.log(`Total Employees who has worked for more than 14 hours in a single shift: ${uniqueNamesLongShifts.size}`);
    });
}

// Example usage

analyzeAttendance('C:\\Users\\SAI AAKANKSHA\\Downloads\\attendance-analysis\\Assignment.csv');
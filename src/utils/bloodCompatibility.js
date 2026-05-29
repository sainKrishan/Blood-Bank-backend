// Rule engine mapping what groups a receiver CAN safely receive
export const isEligible = (receiverGroup, sampleGroup) => {
    const rules = {
        'A+': ['A+', 'A-', 'O+', 'O-'],
        'A-': ['A-', 'O-'],
        'B+': ['B+', 'B-', 'O+', 'O-'],
        'B-': ['B-', 'O-'],
        'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
        'AB-': ['A-', 'B-', 'AB-', 'O-'],
        'O+': ['O+', 'O-'],
        'O-': ['O-'] // Universal Donor only accepts O-
    };
    return rules[receiverGroup]?.includes(sampleGroup) || false;
};
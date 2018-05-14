module.exports = {
    testPathIgnorePatterns: [
        './.idea',
        './.next',
        './node_modules'
    ],
    collectCoverage: true,
    coverageDirectory: './coverage',
    coveragePathIgnorePatterns: [
        "./node_modules"
        // also exclude your setup files here if you have any
    ]
};
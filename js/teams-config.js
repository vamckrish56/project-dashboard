var config = {
    defaultConfig: {
        screenCycle:30000,
        pollInterval:20000,
        builds: {
            id: 'Stats',
            displayName: "Fact Check",
            buildInfoURL: "http://localhost:5000/app/teamcity/builds/buildType:(id:#BUILD_ID#),running:any,branch:#BRANCH#",
            builds: [
                                {id:'Coverage',branch:'develop'},
                                {id:'Bugs',branch:'develop'},
                                {id:'Vulnerabilities',branch:'develop'},
                                {id:'CodeSmells',branch:'develop'},
                                {id:'UDS',branch:'uat_1.2'}
            ]
        }
    },
    suites:[
        {
            id: 'UDS-DFW',
            displayName: 'Unified Data Services ',
            teamBuilds: ['DFW-ET','DFW-Server']
        }
    ],
    teamBuilds: [
        {
            id: 'DFW-Server',
            displayName: "UDS Server Monitoring",
            changesInfoUrl: "http://localhost:5000/app/teamcity/builds/buildType:(id:#BUILD_ID#),sinceChange:#SINCE_CHANGE#,branch:#BRANCH#",
            buildInfoURL: "http://localhost:5000/app/teamcity/builds/buildType:(id:#BUILD_ID#),running:any,branch:#BRANCH#",
            builds: [
                {id:'Memory',branch:'develop'},
                {id:'Cpu',branch:'develop'},
                {id:'Diskspace',branch:'develop'},
                {id:'Database',branch:'develop'},
                {id:'DataLoad',branch:'develop'},
                {id:'Consumption',branch:'develop'}
            ]
        },
        {
                    id: 'DFW-ET',
                    displayName: "Module Builds",
                    changesInfoUrl: "http://localhost:5000/app/teamcity/builds/buildType:(id:#BUILD_ID#),sinceChange:#SINCE_CHANGE#,branch:#BRANCH#",
                    buildInfoURL: "http://localhost:5000/app/teamcity/builds/buildType:(id:#BUILD_ID#),running:any,branch:#BRANCH#",
                    builds: [
                        {id:'Orchestration',branch:'develop'},
                        {id:'Registration',branch:'develop'},
                        {id:'Ingestion',branch:'develop'},
                        {id:'Discovery',branch:'develop'},
                        {id:'Portal',branch:'develop'},
                        {id:'Security',branch:'develop'},
                        {id:'Services',branch:'develop'},
                        {id:'Commons',branch:'develop'},
                        {id:'Core',branch:'develop'},
                        {id:'Utilities',branch:'develop'},
                        {id:'Maintenance',branch:'develop'}
                    ]
                }
    ]
};



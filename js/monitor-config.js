(function (config) {
    var defaultContainerId = '#default-builds';
    var teamsContainerId = '#team-builds';
    var screenCount = 0;
    var currentScreen = 0; //default screen
    var buildConfigs = {}, suiteData = {displayName:'Unified Data Services',teamBuilds:[]}, screenContainers = {};
    var screenCycle = config.defaultConfig.screenCycle;
    var pollInterval = config.defaultConfig.pollInterval;

    var statusMap = {
        SUCCESS: 'success',
        FAILURE: 'failure',
        RUNNING: 'running',
        PENDING: 'pending'
    };

    var template = '<div id="#BUILD_ID#" class="build hidden">' +
        '' +
        '<h2><span class="build-name"></span><span class="pending-changes"></span></h2>' +
        '<span class="build-date"></span>' +
        '<h4>Last Committed By </h4>' +
        '<span class="committers"></span>' +
        '<h2/>' +
        '<h4>Status:</h4><span class="text-status"></span>' +
        '</div>';


    var default_template = '<div id="#BUILD_ID#" class="default-build hidden">' +
        '' +
        '<h4><span class="build-name"></span>  <span class="build-date"></span></h4>' +
        '<h4>Last Committed By '+ '<span class="committers-default"></span>'+ '</h4>' +
        '<h5/>' +
        '<h4>Status:</h4>'+ '<span class="text-status-default"></span>'  +
        '</div>';

    var server_template = '<div id="#BUILD_ID#" class="server-build hidden">' +
        '' +
        '<h4><span class="build-name"></span>  <span class="build-date"></span></h4>' +
        '<h4>'+ '<span class="message-server"></span>'+ '</h4>' +
        '<h4/>' +
        '<span class="text-status-server"></span>'  +
        '<h4/>' +
        '<span class="time-to-complete-server"></span>'  +
        '</div>';


    var ajaxCall = function(url, handler, errorHandler) {
        $.ajax({
            type: 'GET',
            url: url,
            contentType: 'text/plain',
            xhrFields: {
                withCredentials: false
            },
            dataType: 'json',
            crossDomain: true,
            headers: {
                Accept: 'application/json'
                            },

            success: handler,
            error: errorHandler
        });
    }

    var getLastSuccessfulChange = function(config, buildId, buildBranch) {
        var url = config.buildInfoURL.replace("#BUILD_ID#", buildId).replace('#BRANCH#', buildBranch) + ',status:SUCCESS';
        console.log("success url is ",url);
        $.when($.ajax({
            type: 'GET',
            url: url,
            contentType: 'text/plain',
            xhrFields: {
                withCredentials: false
            },
            dataType: 'json',
            crossDomain: true,
            headers: {
                Accept: 'application/json'            }
        })).done(function(resp) {
         if (resp.status == 'SUCCESS')
                {
                    //var jsonResponse = JSON.parse(resp.responseText)
                    if (resp.lastChanges && resp.lastChanges.count > 0)
                    {
                        var lastChange = resp.lastChanges.change[0]
                        return lastChange.id
                    }
                }
                return 0;
        }).fail(function(data) {
            return 0;
        })
    }

    var getPendingChanges = function(config, buildId, buildBranch) {
        if (config.changesInfoUrl)
        {
            var lastSuccessfulChange = getLastSuccessfulChange(config, buildId, buildBranch)
            var url = config.changesInfoUrl.replace("#BUILD_ID#", buildId).replace('#BRANCH#', buildBranch).replace('#SINCE_CHANGE#', lastSuccessfulChange);
            console.log('PENDING CHANGES ',url);
            var resp = $.ajax({
                type: 'GET',
                url: url,
                contentType: 'text/plain',
                xhrFields: {
                    withCredentials: false
                },
                dataType: 'json',
                crossDomain: true,
                headers: {
                    Accept: 'application/json'
                },
                async: false
            })
            if (resp.status == 200)
            {
                var jsonResponse = JSON.parse(resp.responseText);
                return jsonResponse.change.length;
            }
        }
        return 0;
    }

    var getBuildStatus = function (config, buildId, buildBranch, handler, errorHandler) {
        var url = config.buildInfoURL.replace("#BUILD_ID#", buildId).replace('#BRANCH#', buildBranch);
        console.log("url for getbuildstatus is ",url);
        ajaxCall(url, handler, function(){errorHandler(buildId)});
        //getLastSuccessfulChange(config, buildId, buildBranch)
    };

    function getURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1];
            }
        }
    }

    var MINUTE = 60 * 1000,
        MILLI_SECOND = 1000,
        FIVE_MINUTES = 5 * MINUTE,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        MONTH = 30 * DAY,
        YEAR = 365 * DAY;

    var addPlural = function (val, message) {
        return message.replace('#val#', val).replace('#p#', val > 1 ? 's' : '');
    };

    var reformatTime = function (time) {
        var times = [];
        if(time > HOUR) {
                var t = Math.floor(time / HOUR)
                times.push((t<10?"0":"")+t+"h")
                time -= t * HOUR;
        }
        if(time > MINUTE || (time > 0 && times.length > 0)){
                var t = Math.floor(time / MINUTE)
                times.push((t<10?"0":"")+t+"m")
                time -= t * MINUTE;
        }
        if(time > 1000 || times.length > 0){
                var t = Math.floor(time / 1000)
                times.push((t<10?"0":"")+t+"s")
                time -= t * 1000;
        }
        return times.join(':')
    }

var reformatDate = function (date) {
        var curDate = new Date();
        var currentTime = curDate.getTime();
        var localOffset = -1 * curDate.getTimezoneOffset() * 60000;

        var stamp = new Date(currentTime + localOffset).getTime();
            tsDiff = stamp - date.getTime();

        var val;

        if (tsDiff < FIVE_MINUTES) {
            return addPlural((tsDiff / MILLI_SECOND).toFixed(0), "#val# second#p# ago");
        }

        if (tsDiff < HOUR) {
            return addPlural((tsDiff / MINUTE).toFixed(0), "#val# minute#p# ago");
        }

        if (tsDiff < DAY) {
            return addPlural((tsDiff / HOUR).toFixed(0), "#val# hour#p# ago");
        }

        if (tsDiff < MONTH) {
            return addPlural((tsDiff / DAY).toFixed(0), "#val# day#p# ago");
        }

        if (tsDiff < YEAR) {
            return addPlural((tsDiff / MONTH).toFixed(0), "#val# month#p# ago");
        }

        return addPlural((tsDiff / YEAR).toFixed(0), "#val# year#p# ago");
    };

    var getStatusClass = function (status) {
        return statusMap[status] || '';
    };

    var getUniqueCommiters = function (lastChanges) {
        if (!lastChanges || !lastChanges.change) {
            return "NONE";
        }

        var uniq = [];
        lastChanges.change.forEach(function (el) {
            if (uniq.indexOf(el.username) == -1) {
                uniq.push(el.username);
            }
        });
        return uniq.join(", ");
    };

    var buildTemplates = function (buildConfig, parentContainer) {
        buildConfig.builds.forEach(function (build) {
            var buildId = build.id;
            var buildBlock = $(template.replace("#BUILD_ID#", buildId));
            parentContainer.append(buildBlock).append($("<span> </span>"));
        });
        parentContainer.append('<span style="width:100%;display: inline-block"></span>');
        console.log(parentContainer);
    };

     var buildServerTemplates = function (buildConfig, parentContainer) {
            buildConfig.builds.forEach(function (build) {
                var buildId = build.id;
                var buildBlock = $(server_template.replace("#BUILD_ID#", buildId));
                parentContainer.append(buildBlock).append($("<span> </span>"));
            });
            parentContainer.append('<span style="width:100%;display: inline-block"></span>');
            console.log(parentContainer);
        };

    var buildDefaultTemplates = function (buildConfig, parentContainer) {
        buildConfig.builds.forEach(function (build) {
            var buildId = build.id;
            var buildBlock = $(default_template.replace("#BUILD_ID#", buildId));
            parentContainer.append(buildBlock).append($("<span> </span>"));
        });
        parentContainer.append('<span style="width:100%;display: inline-block"></span>');
        console.log(parentContainer);
    };

    var populateHeaders = function (suiteName, teamName) {
        if (suiteName != undefined) {
            $('#suite-name').text(suiteName);
        }
        if (teamName != undefined) {
            $('#team-name').text(teamName);
        }
    };

    var screenSwitch = function () {
        //console.log('switching screens,before: currentScene:'+currentScreen);
        $(screenContainers[currentScreen]).fadeOut(1000, function () {
            progress(1, (screenCycle) / 1000, $('#progressBar'));
            currentScreen = (currentScreen + 1) % (screenCount);
            populateHeaders(suiteData.displayName, buildConfigs[currentScreen].displayName);
            $(screenContainers[currentScreen]).fadeIn(1000);
        });
    };

    var setupScreenSwitch = function () {
	$(screenContainers[i]).show()
        //hide remaining screens at first
        for (i = 1; i < screenCount; i++) {
            $(screenContainers[i]).hide();
        }
        //load default screen.
        poll(buildConfigs[0], defaultContainerId);
        populateHeaders(suiteData.displayName, buildConfigs[0].displayName);
        if(screenCount>1){
		progress(1, (screenCycle) / 1000, $('#progressBar'));
        	setInterval(screenSwitch, screenCycle);
	}
    };

    var handleTeamBuild = function (teamConfig, screenIndex) {
        screenContainers[screenIndex] = '#' + teamConfig.id;
        var teamDivCntr = ($("<div class='build-list' id='" + teamConfig.id + "'> </div>"));
        $(teamsContainerId).append(teamDivCntr);
        if(screenIndex === 1)
            buildTemplates(teamConfig, teamDivCntr);
        if(screenIndex === 2)
            buildServerTemplates(teamConfig,teamDivCntr);
    };

    var setupPolls = function () {
        for (i = 0; i < screenCount; i++) {
            setInterval(poll, pollInterval, buildConfigs[i], screenContainers[i]);
        }
    };

    var init = function () {
        window.suiteId = getURLParameter('suite');

        config.suites.forEach(function (suite, i) {
            if (suiteId === suite.id) {
                suiteData = suite;
            }
        });

        //default build configs
        screenCount = 1;
        //buildTemplates(config.defaultConfig.builds, $(defaultContainerId));
        buildDefaultTemplates(config.defaultConfig.builds, $(defaultContainerId));
        screenContainers[0] = defaultContainerId;
        buildConfigs[0] = config.defaultConfig.builds;

        //team build configs
        if(suiteData){
            screenCount += suiteData.teamBuilds.length;
            suiteData.teamBuilds.forEach(function (teamBuildId, index) {
                config.teamBuilds.forEach(function (teamBuild) {
                    if (teamBuildId === teamBuild.id) {
                        handleTeamBuild(teamBuild, index + 1);
                        buildConfigs[index + 1] = teamBuild;
                    }
                });
            });
        }

        /*//default build configs
        *//*screenCount = 1;
        buildTemplates(config.defaultConfig.builds, $(defaultContainerId));
        screenContainers[0] = defaultContainerId;
        buildConfigs[0] = config.defaultConfig.builds;*//*

        //team build configs
        if(suiteData){
            screenCount += suiteData.teamBuilds.length;
            suiteData.teamBuilds.forEach(function (teamBuildId, index) {
                config.teamBuilds.forEach(function (teamBuild) {
                    if (teamBuildId === teamBuild.id) {
                        handleTeamBuild(teamBuild, index);
                        buildConfigs[index] = teamBuild;
                    }
                });
            });
        }*/

        setupPolls();
        setupScreenSwitch();
    };

    function progress(timefinished, timetotal, $element) {
        var progressBarWidth = (timefinished * $element.width()) / timetotal;
        $element.find('div').animate({width: progressBarWidth});
        if (timefinished < timetotal - 3) {
            setTimeout(function () {
                progress(timefinished + 2, timetotal, $element);
            }, 2000);
        } else if ((timefinished == timetotal - 3)) {
            $element.find('div').animate({width: $element.width()});
        }
    };


    var poll = function (buildConfig, containerId) {
        // console.log("polling for team:"+buildConfig.id);
        buildConfig.builds.forEach(function (build) {
        console.log(build);
            var buildId = build.id;
            var buildBranch = build.branch || 'default:any'
            getBuildStatus(buildConfig, buildId, buildBranch, function (response) {
            if(buildConfig.id=="DFW-ET") {
                    handleResponse(response, containerId, buildConfig, buildId, buildBranch);
                    } else  if(buildConfig.id=="DFW-Server") {
                    handleServerResponse(response, containerId, buildConfig, buildId, buildBranch);
                    } else {
                    handleDefaultResponse(response, containerId, buildConfig, buildId, buildBranch);
                    }
                }
                , function (buildId) {
                    handleError(buildId, containerId)
                })
        });
    };

    var handleError = function (id, containerId) {
        var cntr = $(containerId).find('#' + id);
        var curDate = new Date();
        var currentTime = curDate.getTime();
        var localOffset = -1 * curDate.getTimezoneOffset() * 60000;
        var lastChange = new Date(currentTime + localOffset)
        cntr.find('.project-name').text(id);
        cntr.find('.build-name').text("TEAMCITY COMMUNICATION FAILURE");
        cntr.find('.build-date').text("last reconnect:" + reformatDate(lastChange));
        cntr.find('.committers').text("N/A");
        cntr.find('.text-status').text("N/A");
        cntr.removeClass('old success failure running hidden').addClass(getStatusClass("FAILURE"));

    };

    var shrinkText = function(text, length) {
        if(text.length > length) {
              return text.substring(0, length/2 - 3) + "..." + text.substring(length/2 + 3);
        }
        return text
    }

    var handleResponse = function (rsp, containerId, config, buildId, buildBranch) {
        var id = rsp.buildTypeId,
            cntr = $(containerId).find('#' + id),
            lastChange = parseTCDate(rsp.finishDate);

        cntr.find('.project-name').text(rsp.buildType.projectName + " (" + rsp.state + ")");
        cntr.find('.pending-changes').text('');
        cntr.find('.pending-changes').removeClass('delayed')
        cntr.find('.build-name').text(shrinkText(rsp.buildType.name + (rsp.branchName ? ' - ' + rsp.branchName : ''), 40));
        if (rsp.running){
                cntr.addClass('running')
                var runInfo = rsp['running-info'];
                if(runInfo.elapsedSeconds > runInfo.estimatedTotalSeconds){
                        cntr.find('.build-date').text('overtime: ' + reformatTime(1000 * (runInfo.elapsedSeconds - runInfo.estimatedTotalSeconds)));
                        cntr.addClass('overtime');
                } else {
                        cntr.find('.build-date').text('running: ' + reformatTime(1000 * runInfo.elapsedSeconds));
                        cntr.removeClass('overtime');
                }
        } else {
                if (rsp.status != 'SUCCESS')
                {
                    var pendingChanges = getPendingChanges(config, buildId, buildBranch)
                    if (pendingChanges > 5)
                    {
                        cntr.find('.pending-changes').text("Changes since last commit " + pendingChanges);
                        cntr.find('.pending-changes').addClass('delayed')
                    }
                }
                cntr.removeClass('running')
                cntr.find('.build-date').text(lastChange ? "finished " + reformatDate(lastChange) : "unknown");
        }
        cntr.find('.committers').text(getUniqueCommiters(rsp.lastChanges));
        cntr.find('.text-status').text(rsp.statusText);
        cntr.removeClass('old success failure hidden').addClass(getStatusClass(rsp.status));

        if (!rsp.running && new Date().getTime() - lastChange > 7 * DAY) {
            cntr.addClass('old');
        }

    };

    var handleDefaultResponse = function (rsp, containerId, config, buildId, buildBranch) {
                var id = rsp.buildTypeId,
                    cntr = $(containerId).find('#' + id),
                    lastChange = parseTCDate(rsp.finishDate);

                cntr.find('.project-name').text(rsp.buildType.projectName + " (" + rsp.state + ")");
                cntr.find('.pending-changes').text('');
                cntr.find('.pending-changes').removeClass('delayed')
                if(id=="UDS") {
                    cntr.find('.build-name').text(shrinkText(rsp.buildType.name + (rsp.branchName ? ' - ' + rsp.branchName : ''), 40));
                } else {
                    cntr.find('.build-name').text(shrinkText(rsp.buildType.name /* (rsp.branchName ? ' - ' + rsp.branchName : ''),*/, 40));
                }
                        cntr.removeClass('overtime');
                        cntr.removeClass('running')
                        cntr.find('.build-date').text(lastChange ? "finished " + reformatDate(lastChange) : "unknown");

                cntr.find('.committers-default').text(getUniqueCommiters(rsp.lastChanges));
                cntr.find('.text-status-default').text(rsp.statusText);
                cntr.removeClass('old success failure hidden').addClass(getStatusClass(rsp.status));

                if (id == "Coverage") {
                    cntr.addClass('coverage');
                }
                if (id == "Vulnerabilities") {
                    cntr.addClass('vulnerabilities');
                }if (id == "Bugs") {
                    cntr.addClass('bugs');
                }if (id == "CodeSmells") {
                    cntr.addClass('codeSmells');
                }if(id == "UDS") {
                    cntr.addClass('uds');

                    if(rsp.statusText == "UP") {
                        cntr.removeClass("down");
                        cntr.removeClass("starting");
                        cntr.addClass("up");
                    }
                    if(rsp.statusText == "DOWN") {
                        cntr.removeClass("up");
                        cntr.removeClass("starting");
                        cntr.addClass("down");
                    }
                    if(rsp.statusText == "STARTING") {
                        cntr.removeClass("down");
                        cntr.removeClass("starting");
                        cntr.addClass("starting");
                    }

                }

            };

    var handleServerResponse = function (rsp, containerId, config, buildId, buildBranch) {
            var id = rsp.buildTypeId,
                cntr = $(containerId).find('#' + id),
                lastChange = parseTCDate(rsp.finishDate);

            cntr.find('.project-name').text(rsp.buildType.projectName + " (" + rsp.state + ")");
            cntr.find('.pending-changes').text('');
            cntr.find('.pending-changes').removeClass('delayed')

                cntr.find('.build-name').text(shrinkText(rsp.buildType.name /* (rsp.branchName ? ' - ' + rsp.branchName : ''),*/, 40));
                    cntr.removeClass('overtime');
                    cntr.removeClass('running')

            cntr.find('.message-server').text(rsp.messageText);
            cntr.find('.text-status-server').text(rsp.statusText);
            cntr.removeClass('old success failure hidden').addClass(getStatusClass(rsp.status));

            if (id == "Memory") {
                cntr.addClass('memory');
            }
            if (id == "Diskspace") {
                cntr.addClass('diskspace');
            }if (id == "Cpu") {
                cntr.addClass('cpu');
            }if (id == "Database") {
                cntr.addClass('database');
            }if (id == "DataLoad") {
                cntr.addClass('dataload');
                cntr.removeClass('.text-status-server');
                cntr.addClass('.text-status-server-dataload');
                cntr.find('.text-status-server-dataload').text(rsp.statusText);

                cntr.find('.time-to-complete-server').text(rsp.timeToComplete)
            }if (id == "Consumption") {
                cntr.addClass('consumption');
            }
        };

    var parseTCDate = function (date) {
        if (!date) {
                    return null;
                }

                var timeStamp = Date.parse(date.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\+|-)(\d{4})/, "$1-$2-$3T$4:$5:$6"));
                var tzMatch = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\+|-)(\d{2})(\d{2})/.exec(date);
                if(tzMatch) { var tzShift = +(tzMatch[7] + "1") * ((+tzMatch[8] * 60 * 60 * 1000) + (+tzMatch[9] * 60 * 1000));
                return new Date(timeStamp - tzShift);
                } else {
                    return new Date(timeStamp);
                }
    };

    $(function () {
        setTimeout(init, 2000)
    });
})(config);

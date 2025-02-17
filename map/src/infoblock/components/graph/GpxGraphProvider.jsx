import React, { useContext, useEffect, useMemo, useState } from 'react';
import GpxGraph from './GpxGraph';
import AppContext from '../../../context/AppContext';
import TracksManager from '../../../context/TracksManager';
import _ from 'lodash';
import { Checkbox, Divider, FormControlLabel } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    checkbox: {
        '& .MuiTypography-root': {
            fontSize: '12',
        },
        transform: 'scale(0.8)',
    },
});

const GpxGraphProvider = ({ width }) => {
    const ctx = useContext(AppContext);
    const classes = useStyles();

    const ELEVATION = 'Elevation';
    const ELEVATION_SRTM = 'ElevationSRTM';
    const SPEED = 'Speed';
    const DISTANCE = 'Distance';

    const [data, setData] = useState(null);
    const [showData, setShowData] = useState(null);

    function hasData() {
        return showData[ELEVATION] || showData[ELEVATION_SRTM] || showData[SPEED];
    }

    useEffect(() => {
        let trackData = {};
        if (ctx.selectedGpxFile) {
            let points = _.cloneDeep(TracksManager.getTrackPoints(ctx.selectedGpxFile));
            if (ctx.selectedGpxFile.analysis?.hasElevationData) {
                trackData.ele = true;
                trackData.data = points;
            }
            if (ctx.selectedGpxFile.analysis?.srtmAnalysis) {
                trackData.srtm = true;
                if (!trackData.data) {
                    trackData.data = points;
                }
            }
            if (ctx.selectedGpxFile?.analysis?.hasSpeedData) {
                trackData.speed = true;
                if (!trackData.data) {
                    trackData.data = points;
                }
            }
        }
        if (trackData) {
            setData({ ...trackData });
        }
    }, [ctx.selectedGpxFile]);

    useEffect(() => {
        if (data) {
            let newShowData = {};
            if (data.ele) {
                newShowData[ELEVATION] = data.ele;
            }
            if (data.srtm) {
                newShowData[ELEVATION_SRTM] = data.ele;
            }
            if (data.speed) {
                newShowData[SPEED] = data.ele;
            }
            setShowData(newShowData);
        }
    }, [data]);

    const graphData = useMemo(() => {
        if (!_.isEmpty(data?.data)) {
            let elevation = data.ele ? 'ele' : null;
            let elevationSRTM = data.srtm ? 'srtmEle' : null;
            let points = data.data;
            let result = [];
            let minEle = elevation ? points[0][elevation] : elevationSRTM ? points[0][elevationSRTM] : null;
            let maxEle = elevation ? points[0][elevation] : elevationSRTM ? points[0][elevationSRTM] : null;
            let minSpeed = data.speed ? 0 : null;
            let maxSpeed = data.speed ? 0 : null;
            let sumDist = 0;
            points.forEach((point) => {
                let ele;
                let eleSRTM;
                let speed;
                if (elevation) {
                    ele = TracksManager.getEle(point, elevation, points)?.toFixed(2);
                    if (ele !== undefined) {
                        ele = Math.round(ele * 10) / 10;
                        if (minEle === TracksManager.NAN_MARKER) {
                            minEle = ele;
                        } else {
                            minEle = Math.min(ele, minEle);
                        }

                        if (maxEle === TracksManager.NAN_MARKER) {
                            maxEle = ele;
                        } else {
                            maxEle = Math.max(ele, maxEle);
                        }
                    }
                }
                if (elevationSRTM) {
                    eleSRTM = TracksManager.getEle(point, elevationSRTM, points)?.toFixed(2);
                    if (eleSRTM && !elevation) {
                        eleSRTM = Math.round(eleSRTM * 10) / 10;
                        minEle = Math.min(eleSRTM, minEle);
                        maxEle = Math.max(eleSRTM, maxEle);
                    }
                }
                if (data.speed) {
                    speed = _.cloneDeep(
                        point.speed ? point.speed : point.ext?.speed ? point.ext?.speed : point.ext?.extensions?.speed
                    );
                    if (speed) {
                        speed = ((Math.round(speed * 10) / 10) * 3.6).toFixed(2);
                        minSpeed = Math.min(speed, minSpeed);
                        maxSpeed = Math.max(speed, maxSpeed);
                    }
                }

                // get-analysis might make point.distance inaccurate, so use "total" first
                if (point.distanceTotal > 0 || point.distanceSegment > 0 || point.ext?.distance > 0) {
                    sumDist = point.distanceTotal || point.distanceSegment || point.ext?.distance;
                } else if (point.distance || point.distance === 0) {
                    sumDist += point.distance;
                }

                let dataTab = {
                    [DISTANCE]: Math.round(sumDist) / 1000,
                    [ELEVATION]: ele,
                    [ELEVATION_SRTM]: eleSRTM,
                    [SPEED]: speed,
                };
                result.push(dataTab);
            });
            return { res: result, minEle: minEle, maxEle: maxEle, minSpeed: minSpeed, maxSpeed: maxSpeed };
        }
    }, [data]);

    function checkShowData(value) {
        return value === '' ? false : value;
    }

    return (
        <>
            {graphData && showData && <Divider sx={{ mt: '3px', mb: '12px' }} />}
            <div style={{ marginLeft: '20px' }}>
                {showData &&
                    Object.entries(showData).map(([key, value]) => (
                        <FormControlLabel
                            className={classes.checkbox}
                            key={key}
                            label={key === ELEVATION_SRTM ? 'Elevation (Satellite)' : key}
                            control={
                                <Checkbox
                                    sx={{ marginLeft: '-30px' }}
                                    checked={checkShowData(value)}
                                    onChange={() => {
                                        let updatedShowData = Object.assign({}, showData);
                                        updatedShowData[key] = !value;
                                        setShowData(updatedShowData);
                                    }}
                                />
                            }
                        ></FormControlLabel>
                    ))}
            </div>
            {graphData && showData && hasData() && (
                <GpxGraph
                    data={graphData?.res}
                    showData={showData}
                    xAxis={DISTANCE}
                    y1Axis={[ELEVATION, ELEVATION_SRTM]}
                    y2Axis={SPEED}
                    width={width}
                    minEle={graphData?.minEle}
                    maxEle={graphData?.maxEle}
                    minSpeed={graphData?.minSpeed}
                    maxSpeed={graphData?.maxSpeed}
                />
            )}
        </>
    );
};

export default GpxGraphProvider;

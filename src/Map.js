import React, { useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from 'react-redux';

const { kakao } = window

const Map = () => {
    const dispatch = useDispatch();
    const busLocation = useSelector(state => state.busLocation);
    const locationValue = useSelector(state => state.location);
    const currentMap = useSelector(state => state.map);

    useEffect(() => {
        (async () => {
            const location = await getUserLocation();
            dispatch({
                type: 'SETLOCATION',
                location
            });
            const container = document.getElementById("myMap")

            const options = {
                center: new kakao.maps.LatLng(location.latitude, location.longitude),
                level: 3,
            }
            const map = new kakao.maps.Map(container, options)
            dispatch({
                type: 'SETMAP',
                map
            });

            kakao.maps.event.addListener(map, 'dragend', function () {
                // 지도 중심좌표를 얻어옵니다 
                var latlng = map.getCenter();

                const latitude = latlng.getLat();   // 위도
                const longitude = latlng.getLng() // 경도
                dispatch({
                    type: 'SETLOCATION',
                    location: { latitude, longitude }
                });

                var message = '변경된 지도 중심좌표는 ' + latlng.getLat() + ' 이고, ';
                message += '경도는 ' + latlng.getLng() + ' 입니다';
            });


            let res = [];
            let url = 'http://apis.data.go.kr/1613000/BusLcInfoInqireService/getRouteAcctoBusLcList'; /*URL*/
            let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D'; /*Service Key*/
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /**/
            queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('xml'); /**/
            queryParams += '&' + encodeURIComponent('cityCode') + '=' + encodeURIComponent('31240'); /**/
            queryParams += '&' + encodeURIComponent('routeId') + '=' + encodeURIComponent('GGB233000266'); /**/
            try {
                const response = await sendHttpRequest('GET', url, queryParams);
                if (response.status === 200) {
                    var xmlDoc = response.responseXML;
                    var items = xmlDoc.getElementsByTagName('item');
                    // 파싱된 데이터 사용
                    for (var i = 0; i < items.length; i++) {
                        var latitude = items[i].getElementsByTagName('gpslati')[0].childNodes[0].nodeValue;
                        var longitude = items[i].getElementsByTagName('gpslong')[0].childNodes[0].nodeValue;
                        var vehicleno = items[i].getElementsByTagName('vehicleno')[0].childNodes[0].nodeValue;
                        res.push({ latitude, longitude, vehicleno })
                    }
                } else {
                    console.error("status 에러 발생:", response.statusText);
                }
            } catch (error) {
                console.error("에러 발생:", error);
            }

            const busStation = [];
            url = 'http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList';
            queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D';
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /**/
            queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('xml'); /**/
            queryParams += '&' + encodeURIComponent('cityCode') + '=' + encodeURIComponent('31240'); /**/
            queryParams += '&' + encodeURIComponent('routeId') + '=' + encodeURIComponent('GGB233000266'); /**/
            try {
                const response = await sendHttpRequest('GET', url, queryParams);
                if (response.status === 200) {
                    var xmlDoc = response.responseXML;
                    var items = xmlDoc.getElementsByTagName('item');
                    // 파싱된 데이터 사용
                    for (var i = 0; i < items.length; i++) {
                        var latitude = items[i].getElementsByTagName('gpslati')[0].childNodes[0].nodeValue;
                        var longitude = items[i].getElementsByTagName('gpslong')[0].childNodes[0].nodeValue;
                        var nodeord = items[i].getElementsByTagName('nodeord')[0].childNodes[0].nodeValue;
                        busStation.push({ latitude, longitude, nodeord })
                    }
                } else {
                    console.error("status 에러 발생:", response.statusText);
                }
            } catch (error) {
                console.error("에러 발생:", error);
            }

            url = 'http://apis.data.go.kr/6410000/buslocationservice/getBusLocationList';
            queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D';
            queryParams += '&' + encodeURIComponent('routeId') + '=' + encodeURIComponent('233000266');
            try {
                const response = await sendHttpRequest('GET', url, queryParams);
                if (response.status === 200) {
                    let extraData = [];
                    var xmlDoc = response.responseXML;
                    var items = xmlDoc.getElementsByTagName('busLocationList');
                    // 파싱된 데이터 사용
                    for (var i = 0; i < items.length; i++) {
                        let remainSeatCnt = items[i].getElementsByTagName('remainSeatCnt')[0].childNodes[0].nodeValue;
                        let stationSeq = items[i].getElementsByTagName('stationSeq')[0].childNodes[0].nodeValue;
                        let plateNo = items[i].getElementsByTagName('plateNo')[0].childNodes[0].nodeValue;
                        let added = false;
                        res.forEach((n, i) => {
                            if (n.vehicleno === plateNo) {
                                res[i].remainSeatCnt = remainSeatCnt;
                                res[i].stationSeq = stationSeq;
                                added = true;
                            }
                        });
                        if (!added) {
                            busStation.forEach((n, i) => {
                                if (n.nodeord === stationSeq) {
                                    extraData.push({
                                        remainSeatCnt,
                                        stationSeq,
                                        vehicleno: plateNo,
                                        latitude: n.latitude,
                                        longitude: n.longitude
                                    })
                                }
                            })
                        }
                    }
                    res = [...res, ...extraData]
                    dispatch({
                        type: 'SETBUSLOCATION',
                        busLocation: res
                    });
                } else {
                    console.error("에러 발생:", response.statusText);
                }
            } catch (error) {
                console.error("에러 발생:", error);
            }
        })();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setBusMarker()
        }, 5000);

        return () => clearInterval(intervalId);
    }, [busLocation]);

    const setBusMarker = () => {
        console.log('setBusMaker')
        if (busLocation) {
            console.log(busLocation)
            busLocation.forEach(e => {
                // 마커가 표시될 위치입니다 
                var markerPosition = new kakao.maps.LatLng(e.latitude, e.longitude);
                // 마커를 생성합니다
                var marker = new kakao.maps.Marker({
                    position: markerPosition
                });
                marker.setMap(currentMap);
                var iwContent = `<div style="padding:5px;">${e.stationSeq}정류소 ${e.remainSeatCnt}석</div>`, // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다
                    iwPosition = new kakao.maps.LatLng(e.latitude, e.longitude); //인포윈도우 표시 위치입니다

                // 인포윈도우를 생성합니다
                var infowindow = new kakao.maps.InfoWindow({
                    position: iwPosition,
                    content: iwContent
                });


                kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(currentMap, marker, infowindow));
            });
        }
    }
    // 인포윈도우를 표시하는 클로저를 만드는 함수입니다 
    const makeOverListener = (map, marker, infowindow) => {
        return function () {
            infowindow.open(map, marker);
        };
    }
    const sendHttpRequest = (method, url, param) => {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url + param);
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(new Error(xhr.statusText));
                }
            };
            xhr.onerror = function () {
                reject(new Error("Network error"));
            };
            xhr.send('');
        });
    }


    const getUserLocation = async () => {
        const getLocation = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            })
        }
        try {
            const result = await getLocation();
            const latitude = result.coords.latitude;   // 위도
            const longitude = result.coords.longitude; // 경도
            return { latitude, longitude }
        }
        catch (error) {
            return { latitude: '37.1634656', longitude: '127.1169024' } // 디폴트
        }
    }

    return (
        <>
            {locationValue &&
                <div>
                    <div> 현재 위치 : {locationValue.latitude} / {locationValue.longitude}</div>
                    <hr />
                </div>
            }
            <div
                id="myMap"
                style={{
                    display: "block",
                    position: "relative",
                    margin: "auto",
                    width: "500px",
                    height: "500px",
                }}>
            </div>
            <hr />
        </>
    )
}

export default Map
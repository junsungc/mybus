import React, { useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from 'react-redux';

const { kakao } = window

const Map = () => {
    const dispatch = useDispatch();
    const busLocation = useSelector(state => state.busLocation);
    const locationValue = useSelector(state => state.location);
    const currentMap = useSelector(state => state.map);
    const [isLine, setLine] = useState(false);
    const targetMap = useRef([]);

    let drawingFlag = false; // 선이 그려지고 있는 상태를 가지고 있을 변수입니다
    let moveLine; // 선이 그려지고 있을때 마우스 움직임에 따라 그려질 선 객체 입니다
    let clickLine // 마우스로 클릭한 좌표로 그려질 선 객체입니다
    let distanceOverlay; // 선의 거리정보를 표시할 커스텀오버레이 입니다
    let dots = {}; // 선이 그려지고 있을때 클릭할 때마다 클릭 지점과 거리를 표시하는 커스텀 오버레이 배열입니다.

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


            //TODO XMLHttpRequest Promise로 래핑할것 https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr 
            let xhr = new XMLHttpRequest();
            let url = 'http://apis.data.go.kr/1613000/BusLcInfoInqireService/getRouteAcctoBusLcList'; /*URL*/
            let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D'; /*Service Key*/
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /**/
            queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('xml'); /**/
            queryParams += '&' + encodeURIComponent('cityCode') + '=' + encodeURIComponent('31240'); /**/
            queryParams += '&' + encodeURIComponent('routeId') + '=' + encodeURIComponent('GGB233000266'); /**/
            xhr.open('GET', url + queryParams);
            let res = []
            let a = xhr.onreadystatechange = await function () {
                if (this.readyState == 4 && this.status === 200) {
                    var xmlDoc = this.responseXML;
                    var items = xmlDoc.getElementsByTagName('item');
                    // 파싱된 데이터 사용
                    for (var i = 0; i < items.length; i++) {
                        var citycode = items[i].getElementsByTagName('gpslati')[0].childNodes[0].nodeValue;
                        var cityname = items[i].getElementsByTagName('gpslong')[0].childNodes[0].nodeValue;
                        var vehicleno = items[i].getElementsByTagName('vehicleno')[0].childNodes[0].nodeValue;
                        res.push({ latitude: citycode, longitude: cityname, vehicleno: vehicleno })
                    }
                    //6003 GGB233000266 latitude, longitude
                    console.log(res)
                }
            };
            console.log(a)
            xhr.send('');
            console.log(res)

            xhr = new XMLHttpRequest();
            url = 'http://apis.data.go.kr/6410000/buslocationservice/getBusLocationList';
            queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D';
            queryParams += '&' + encodeURIComponent('routeId') + '=' + encodeURIComponent('233000266');
            xhr.open('GET', url + queryParams);
            xhr.onreadystatechange = await function () {
                if (this.readyState == 4 && this.status === 200) {
                    var xmlDoc = this.responseXML;
                    var items = xmlDoc.getElementsByTagName('busLocationList');
                    // 파싱된 데이터 사용
                    for (var i = 0; i < items.length; i++) {
                        let remainSeatCnt = items[i].getElementsByTagName('remainSeatCnt')[0].childNodes[0].nodeValue;
                        let plateNo = items[i].getElementsByTagName('plateNo')[0].childNodes[0].nodeValue;
                        res.forEach((n, i) => {
                            if (n.vehicleno === plateNo) {
                                res[i].remainSeatCnt = remainSeatCnt
                            }
                        });
                    }
                    console.log(res)
                    dispatch({
                        type: 'SETBUSLOCATION',
                        busLocation: res
                    });
                }
            };
            xhr.send('');
        })();
    }, []);


    const clickHandler = (mouseEvent) => {

        // 마우스로 클릭한 위치입니다 
        var clickPosition = mouseEvent.latLng;

        // 지도 클릭이벤트가 발생했는데 선을 그리고있는 상태가 아니면
        if (!drawingFlag) {

            // 상태를 true로, 선이 그리고있는 상태로 변경합니다
            drawingFlag = true;

            // 지도 위에 선이 표시되고 있다면 지도에서 제거합니다
            deleteClickLine();

            // 지도 위에 커스텀오버레이가 표시되고 있다면 지도에서 제거합니다
            deleteDistnce();

            // 지도 위에 선을 그리기 위해 클릭한 지점과 해당 지점의 거리정보가 표시되고 있다면 지도에서 제거합니다
            deleteCircleDot();

            // 클릭한 위치를 기준으로 선을 생성하고 지도위에 표시합니다
            clickLine = new kakao.maps.Polyline({
                map: currentMap, // 선을 표시할 지도입니다 
                path: [clickPosition], // 선을 구성하는 좌표 배열입니다 클릭한 위치를 넣어줍니다
                strokeWeight: 3, // 선의 두께입니다 
                strokeColor: '#db4040', // 선의 색깔입니다
                strokeOpacity: 1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                strokeStyle: 'solid' // 선의 스타일입니다
            });

            // 선이 그려지고 있을 때 마우스 움직임에 따라 선이 그려질 위치를 표시할 선을 생성합니다
            moveLine = new kakao.maps.Polyline({
                strokeWeight: 3, // 선의 두께입니다 
                strokeColor: '#db4040', // 선의 색깔입니다
                strokeOpacity: 0.5, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                strokeStyle: 'solid' // 선의 스타일입니다    
            });

            // 클릭한 지점에 대한 정보를 지도에 표시합니다
            displayCircleDot(clickPosition, 0);


        } else { // 선이 그려지고 있는 상태이면

            // 그려지고 있는 선의 좌표 배열을 얻어옵니다
            var path = clickLine.getPath();

            // 좌표 배열에 클릭한 위치를 추가합니다
            path.push(clickPosition);

            // 다시 선에 좌표 배열을 설정하여 클릭 위치까지 선을 그리도록 설정합니다
            clickLine.setPath(path);

            var distance = Math.round(clickLine.getLength());
            displayCircleDot(clickPosition, distance);
        }
    }

    const moveHandler = (mouseEvent) => {
        // 지도 마우스무브 이벤트가 발생했는데 선을 그리고있는 상태이면
        if (drawingFlag) {

            // 마우스 커서의 현재 위치를 얻어옵니다 
            var mousePosition = mouseEvent.latLng;

            // 마우스 클릭으로 그려진 선의 좌표 배열을 얻어옵니다
            var path = clickLine.getPath();

            // 마우스 클릭으로 그려진 마지막 좌표와 마우스 커서 위치의 좌표로 선을 표시합니다
            var movepath = [path[path.length - 1], mousePosition];
            moveLine.setPath(movepath);
            moveLine.setMap(currentMap);

            var distance = Math.round(clickLine.getLength() + moveLine.getLength()), // 선의 총 거리를 계산합니다
                content = '<div class="dotOverlay distanceInfo">총거리 <span class="number">' + distance + '</span>m</div>'; // 커스텀오버레이에 추가될 내용입니다

            // 거리정보를 지도에 표시합니다
            showDistance(content, mousePosition);
        }
    }

    const rightclickHandler = () => {

        // 지도 오른쪽 클릭 이벤트가 발생했는데 선을 그리고있는 상태이면
        if (drawingFlag) {

            // 마우스무브로 그려진 선은 지도에서 제거합니다
            moveLine.setMap(null);
            moveLine = null;

            // 마우스 클릭으로 그린 선의 좌표 배열을 얻어옵니다
            var path = clickLine.getPath();

            // 선을 구성하는 좌표의 개수가 2개 이상이면
            if (path.length > 1) {

                // 마지막 클릭 지점에 대한 거리 정보 커스텀 오버레이를 지웁니다
                if (dots[dots.length - 1].distance) {
                    dots[dots.length - 1].distance.setMap(null);
                    dots[dots.length - 1].distance = null;
                }

                var distance = Math.round(clickLine.getLength()), // 선의 총 거리를 계산합니다
                    content = getTimeHTML(distance); // 커스텀오버레이에 추가될 내용입니다

                // 그려진 선의 거리정보를 지도에 표시합니다
                showDistance(content, path[path.length - 1]);

            } else {

                // 선을 구성하는 좌표의 개수가 1개 이하이면 
                // 지도에 표시되고 있는 선과 정보들을 지도에서 제거합니다.
                deleteClickLine();
                deleteCircleDot();
                deleteDistnce();

            }

            // 상태를 false로, 그리지 않고 있는 상태로 변경합니다
            drawingFlag = false;
        }
    }


    // 클릭으로 그려진 선을 지도에서 제거하는 함수입니다
    function deleteClickLine() {
        if (clickLine) {
            clickLine.setMap(null);
            clickLine = null;
        }
    }

    // 마우스 드래그로 그려지고 있는 선의 총거리 정보를 표시하거
    // 마우스 오른쪽 클릭으로 선 그리가 종료됐을 때 선의 정보를 표시하는 커스텀 오버레이를 생성하고 지도에 표시하는 함수입니다
    function showDistance(content, position) {

        if (distanceOverlay) { // 커스텀오버레이가 생성된 상태이면

            // 커스텀 오버레이의 위치와 표시할 내용을 설정합니다
            distanceOverlay.setPosition(position);
            distanceOverlay.setContent(content);

        } else { // 커스텀 오버레이가 생성되지 않은 상태이면

            // 커스텀 오버레이를 생성하고 지도에 표시합니다
            distanceOverlay = new kakao.maps.CustomOverlay({
                map: currentMap, // 커스텀오버레이를 표시할 지도입니다
                content: content,  // 커스텀오버레이에 표시할 내용입니다
                position: position, // 커스텀오버레이를 표시할 위치입니다.
                xAnchor: 0,
                yAnchor: 0,
                zIndex: 3
            });
        }
    }

    // 그려지고 있는 선의 총거리 정보와 
    // 선 그리가 종료됐을 때 선의 정보를 표시하는 커스텀 오버레이를 삭제하는 함수입니다
    function deleteDistnce() {
        if (distanceOverlay) {
            distanceOverlay.setMap(null);
            distanceOverlay = null;
        }
    }

    // 선이 그려지고 있는 상태일 때 지도를 클릭하면 호출하여 
    // 클릭 지점에 대한 정보 (동그라미와 클릭 지점까지의 총거리)를 표출하는 함수입니다
    function displayCircleDot(position, distance) {

        // 클릭 지점을 표시할 빨간 동그라미 커스텀오버레이를 생성합니다
        var circleOverlay = new kakao.maps.CustomOverlay({
            content: '<span class="dot"></span>',
            position: position,
            zIndex: 1
        });

        // 지도에 표시합니다
        circleOverlay.setMap(currentMap);

        if (distance > 0) {
            // 클릭한 지점까지의 그려진 선의 총 거리를 표시할 커스텀 오버레이를 생성합니다
            var distanceOverlay = new kakao.maps.CustomOverlay({
                content: '<div class="dotOverlay">거리 <span class="number">' + distance + '</span>m</div>',
                position: position,
                yAnchor: 1,
                zIndex: 2
            });

            // 지도에 표시합니다
            distanceOverlay.setMap(currentMap);
        }

        // 배열에 추가합니다
        dots.push({ circle: circleOverlay, distance: distanceOverlay });
    }

    // 클릭 지점에 대한 정보 (동그라미와 클릭 지점까지의 총거리)를 지도에서 모두 제거하는 함수입니다
    function deleteCircleDot() {
        var i;

        for (i = 0; i < dots.length; i++) {
            if (dots[i].circle) {
                dots[i].circle.setMap(null);
            }

            if (dots[i].distance) {
                dots[i].distance.setMap(null);
            }
        }

        dots = [];
    }

    // 마우스 우클릭 하여 선 그리기가 종료됐을 때 호출하여 
    // 그려진 선의 총거리 정보와 거리에 대한 도보, 자전거 시간을 계산하여
    // HTML Content를 만들어 리턴하는 함수입니다
    function getTimeHTML(distance) {

        // 도보의 시속은 평균 4km/h 이고 도보의 분속은 67m/min입니다
        var walkkTime = distance / 67 | 0;
        var walkHour = '', walkMin = '';

        // 계산한 도보 시간이 60분 보다 크면 시간으로 표시합니다
        if (walkkTime > 60) {
            walkHour = '<span class="number">' + Math.floor(walkkTime / 60) + '</span>시간 '
        }
        walkMin = '<span class="number">' + walkkTime % 60 + '</span>분'

        // 자전거의 평균 시속은 16km/h 이고 이것을 기준으로 자전거의 분속은 267m/min입니다
        var bycicleTime = distance / 227 | 0;
        var bycicleHour = '', bycicleMin = '';

        // 계산한 자전거 시간이 60분 보다 크면 시간으로 표출합니다
        if (bycicleTime > 60) {
            bycicleHour = '<span class="number">' + Math.floor(bycicleTime / 60) + '</span>시간 '
        }
        bycicleMin = '<span class="number">' + bycicleTime % 60 + '</span>분'

        // 거리와 도보 시간, 자전거 시간을 가지고 HTML Content를 만들어 리턴합니다
        var content = '<ul class="dotOverlay distanceInfo">';
        content += '    <li>';
        content += '        <span class="label">총거리</span><span class="number">' + distance + '</span>m';
        content += '    </li>';
        content += '    <li>';
        content += '        <span class="label">도보</span>' + walkHour + walkMin;
        content += '    </li>';
        content += '    <li>';
        content += '        <span class="label">자전거</span>' + bycicleHour + bycicleMin;
        content += '    </li>';
        content += '</ul>'

        return content;
    }

    if (currentMap) {
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
                var iwContent = `<div style="padding:5px;">${e.remainSeatCnt}</div>`, // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다
                    iwPosition = new kakao.maps.LatLng(e.latitude, e.longitude); //인포윈도우 표시 위치입니다

                // 인포윈도우를 생성합니다
                var infowindow = new kakao.maps.InfoWindow({
                    position: iwPosition,
                    content: iwContent
                });


                // 마커 위에 인포윈도우를 표시합니다. 두번째 파라미터인 marker를 넣어주지 않으면 지도 위에 표시됩니다
                infowindow.open(currentMap, marker);
            });
        }
        if (isLine) {
            kakao.maps.event.addListener(currentMap, 'click', clickHandler);
            kakao.maps.event.addListener(currentMap, 'mousemove', moveHandler);
            kakao.maps.event.addListener(currentMap, 'rightclick', rightclickHandler);
            targetMap.current.push({ target: currentMap, type: 'click', handler: clickHandler });
            targetMap.current.push({ target: currentMap, type: 'mousemove', handler: moveHandler });
            targetMap.current.push({ target: currentMap, type: 'rightclick', handler: rightclickHandler });
        } else if (targetMap.current.length != 0) {
            targetMap.current.forEach(function (e) {
                kakao.maps.event.removeListener(e.target, e.type, e.handler);
            });
        }
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
            <button onClick={() => { setLine(!isLine) }}>거리 재기</button>
            {isLine ?
                <span> ON</span>
                :
                <span> OFF</span>
            }
        </>
    )
}

export default Map
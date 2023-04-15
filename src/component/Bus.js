import React, { useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from 'react-redux';

const { kakao } = window

const Bus = () => {
    const dispatch = useDispatch();
    const busLocation = useSelector(state => state.busLocation);

    useEffect(() => {

        // 도시 코드 조회 //
        // let url = 'http://apis.data.go.kr/1613000/BusLcInfoInqireService/getCtyCodeList'; /*URL*/
        // let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D'; /*Service Key*/
        // queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('xml'); /**/
        // xhr.open('GET', url + queryParams);
        // xhr.onreadystatechange = function () {
        //     if (this.readyState === 4 && this.status === 200) {

        //         var xmlDoc = this.responseXML;
        //         var items = xmlDoc.getElementsByTagName('item');

        //         // 파싱된 데이터 사용
        //         for (var i = 0; i < items.length; i++) {
        //             var citycode = items[i].getElementsByTagName('citycode')[0].childNodes[0].nodeValue;
        //             var cityname = items[i].getElementsByTagName('cityname')[0].childNodes[0].nodeValue;
        //         }
        //         //화성시 31240
        //     }
        // };

        // 도시별 버스노선 조회 //
        // url = 'http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList'; /*URL*/
        // queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'UfIEM6jLupWmJHj4FCZPTi7m%2BFS1n8bIzTCxU7CF4vc%2FmiustktE9a1kcd37Gxnq7m5aVKqoBONQzgEPw97Nwg%3D%3D'; /*Service Key*/
        // queryParams += '&' + encodeURIComponent('cityCode') + '=' + encodeURIComponent('31240'); /**/
        // queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('1000'); /**/
        // xhr.open('GET', url + queryParams);
        // xhr.onreadystatechange = function () {
        //     if (this.readyState == 4 && this.status === 200) {
        //         var xmlDoc = this.responseXML;
        //         var items = xmlDoc.getElementsByTagName('item');

        //         // 파싱된 데이터 사용
        //         for (var i = 0; i < items.length; i++) {
        //             var citycode = items[i].getElementsByTagName('routeid')[0].childNodes[0].nodeValue;
        //             var cityname = items[i].getElementsByTagName('routeno')[0].childNodes[0].nodeValue;
        //         }
        //         //6003 GGB233000266 
        //     }
        // };
        console.log('useEffect');
        (async () => {
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
            xhr.onreadystatechange = await function () {
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
                }
            };
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
                                console.log('hii')
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
    return (
        <div>
            {busLocation && busLocation.map((n) => <div>{n.latitude + ' / ' + n.longitude}</div>)}
        </div>
    )

}

export default Bus
// /** Class based component */
// // import React, { type ChangeEvent } from 'react';
// //
// // export default class AppComponent extends React.Component {
// //     constructor(props: any) {
// //         super(props);
// //     }
// //
// //     state = {
// //         firstName: "jnkjnk",
// //         lastName: ""
// //     };
// //
// //     componentDidMount() {
// //         /** usually done to fetch data */
// //         /** usually done to initialize listeners */
// //         document.addEventListener("keydown", () => {
// //
// //         });
// //     }
// //
// //     componentDidUpdate() {
// //
// //     }
// //
// //     componentWillUnmount() {
// //         document.removeEventListener("keydown", () => {});
// //     }
// //
// //     handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
// //         this.setState({
// //             firstName: event.target.value,
// //         });
// //     }
// //
// //     render() {
// //         return (
// //             <div>
// //                 <p style={{ width: "90px", height: "90px", background: "yellow", color: "black", fontSize: 20 }}>
// //                     {this.state.firstName}
// //                 </p>
// //                 <input type="text" value={this.state.firstName} onChange={this.handleChange.bind(this)} />
// //             </div>
// //         );
// //     }
// // }
//
// import {useCallback, useEffect, useLayoutEffect, useMemo, useState} from "react";
//
// /** Function Based Component */
//
// const App = (props: any) => {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//
//   const [isMounted, setIsMounted] = useState(false);
//
//   const handleChange = useCallback((e:any) => {
//     e.preventDefault();
//     setLastName(e.target.value);
//   }, [])
//
//   const textComponent = useMemo(() => {
//     return <p>
//       {firstName}
//     </p>
//   }, [firstName]);
//
//
//   /** Equivalent to component did mount */
//   useEffect(() => {
//     setIsMounted(true);
//
//     document.addEventListener("keydown", () => {
//
//     })
//
//     return () => {
//       document.removeEventListener("keydown", () => {
//
//       })
//     }
//   }, [])
//
//   /** Equivalent to componentDidUpdate, also executed on mount */
//   useEffect(() => {
//     if (!isMounted) return;
//   });
//
//   /** Equivalent to componentDidUpdate but only if ONE of the dependencies changed, also executed on mount */
//   useEffect(() => {
//     if (!isMounted) return;
//     console.log(firstName);
//     fetchDataUsingFirstName(firstName)
//     fetchDataUsingLastName(lastName)
//
//     /**
//      * setLastName(...)
//      * */
//   }, [firstName]);
//
//   return <div>
//     {textComponent}
//     <input type="text" onChange={handleChange}/>
//   </div>
// }
//
// export default App;

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppRouter />
        </BrowserRouter>
    );
};

export default App;

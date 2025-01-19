import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fireMessage } from './Signup';
import { useAuth } from '../../../../Context/AdminAuthContext';
import { delay } from './Signup';

function Login() {
    const [email, setEmail] = useState("singhakshay8794@gmail.com");
    const [password, setPassword] = useState("Akshaysingh@0");
    const [rememberMe, setRememberMe] = useState('7');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [isDetailsVerified, setIsDetailsVerified] = useState(null)
    const [intervalId, setIntervalId] = useState(null)
    const [otpTimer, setOtpTimer] = useState(null)
    const otpInputComponentRef = useRef()
    const otpInputComponentChildRef = useRef()
    const otpInputRef = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const { setAdminName, setAdminEmail, setAdminPhone } = useAuth();
    const [tempName, setTempName] = useState(null)
    const [tempEmail, setTempEmail] = useState(null)
    const [tempPhone, setTempPhone] = useState(null) 
    const navigate = useNavigate();

    useEffect(() => {
        if (isDetailsVerified) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [isDetailsVerified]);

    const handleForm = async (e) => {
        e.preventDefault();
        const validateEmail = () => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePassword = () => {
            // min 8 letter + 1 spec symb + 1 no
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            return passwordRegex.test(password);
        };
        if (!validateEmail()) {
            return await fireMessage('INVALID EMAIL', 'error')
        } else if (!validatePassword()) {
            return await fireMessage('Password must have minimum eight characters, at least one uppercase letter, one lowercase letter and one number', 'error')
        }

        try {
            const res = await fetch("http://localhost:5000/admin/login", {
                method: "POST",
                body: JSON.stringify({ email, password, rememberMe }),
                headers: {
                    'content-type': 'application/json'
                },
                credentials: 'include'
            })
            const data = await res.json();
            if (res.status >= 300) {
                fireMessage(data.message, 'error')
            } else {
                setIsDetailsVerified(true);
                handleSendOtp("email")
                setTempName(data.name)
                setTempEmail(data.email)
                setTempPhone(data.phone)
            }
        } catch (error) {
            fireMessage(error.message, 'error')
        }
    }
    const handleInput = (e, idx) => {
        const current = e.target;
        const value = current.value;
        if (/^[0-9]$/.test(value)) {
            if (idx < otpInputRef.length - 1) {
                otpInputRef[idx + 1].current.focus();
                otpInputRef[idx + 1].current.select();
            }
        } else {
            current.value = '';
        }
    };
    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const current = otpInputRef[idx].current;
            current.value = ''; // Clear current input

            if (idx > 0) {
                otpInputRef[idx - 1].current.focus();
            }
        }
    };
    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        if (!new RegExp(`^[0-9]{${otpInputRef.length}}$`).test(text)) {
            return;
        }
        const digits = text.split('');
        otpInputRef.forEach((ref, index) => {
            if (digits[index]) {
                ref.current.value = digits[index];
            }
        });
    };
    const startTimer = () => {
        const totalTime = new Date(Date.now() + (5 * 60 * 1000)).getTime();
        const id = setInterval(() => {
            let now = new Date().getTime();
            let remaningTime = totalTime - now;
            const minutes = Math.floor((remaningTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaningTime % (1000 * 60)) / 1000);
            setOtpTimer(`${minutes} : ${seconds}`)
            if (remaningTime < 0) {
                setOtpTimer(null)
                clearInterval(intervalId);
            }
        }, 1000)
        setIntervalId(id);
    }
    const handleSendOtp = async (type) => {
        let target
        if (type === 'email') {
            target = email;
        } else {
            return fireMessage("INVALID TARGET TYPE", 'error')
        }
        try {
            const res = await fetch("http://localhost:5000/admin/request-otp", {
                method: "POST",
                body: JSON.stringify({
                    target, type
                }),
                headers: {
                    "content-type": "application/json"
                },
            })
            const { message } = await res.json();
            if (res.status !== 200) {
                await fireMessage(message, 'error')
            } else {
                // otp has send 
                startTimer();
            }
        } catch (error) {
            await fireMessage(error.message, 'error')
        }
    }
    const handleVerifyEmailOtp = async () => {
        let otp = otpInputRef.map((ref) => ref.current.value).join("");
        let target = email;
        try {
            const res = await fetch("http://localhost:5000/admin/verify-otp", {
                method: "POST",
                body: JSON.stringify({
                    target, otp
                }),
                headers: {
                    'content-type': 'application/json'
                }
            })
            const { message } = await res.json();
            if (res.status !== 200) {
                await fireMessage(message, 'error')
            } else {
                // we got a correct otp
                clearInterval(intervalId);
                for (const otpDigit of otpInputRef) {
                    otpDigit.current.style.border = '1px solid green'
                }
                setIntervalId(null)
                await delay(1500);
                'blur-sm overflow-hidden'.split(' ').forEach(c => {
                    otpInputComponentRef.current.classList.add(c);
                });
                'transition-transform duration-400 translate-x-full'.split(' ').forEach(c => {
                    otpInputComponentChildRef.current.classList.add(c);
                });
                fireMessage('YOU LOGGED IN', 'success')
                setAdminName(tempName)
                setAdminEmail(tempEmail)
                setAdminPhone(tempPhone)
                navigate('/admin/dashboard', { replace: true })
            }
        } catch (error) {
            await fireMessage(error.message, 'error')
        }
    }

    return (<>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
                <h1 className="font-bold lg:text-desktopHeadlineSmall sm:text-mobileHeadlineLarge text-center ">Welcome to Ankit Studio</h1>
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form onSubmit={handleForm} method='POST' className="space-y-4">
                    <div>
                        <label htmlFor="email" className={`block text-sm font-medium after:content-["*"] after:text-red-600 text-gray-700`}>Email Address</label>
                        <input
                            value={email}
                            type="email"
                            id="email"
                            name="email"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Enter your email"
                            required
                            onInput={(e) => { setEmail(e.target.value); console.log(e.target.value) }}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={`block text-sm font-medium after:content-["*"] after:text-red-600 text-gray-700`}>Password</label>
                        <div className="input relative">
                            <input
                                autoComplete='on'
                                value={password}
                                type={`${isPasswordVisible ? "text" : 'password'}`}
                                id="password"
                                name="password"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Enter your password"
                                required
                                onInput={(e) => { setPassword(e.target.value); console.log(e.target.value) }}
                            />
                            <button className='absolute right-0 top-2 px-2' onClick={(e) => {
                                e.preventDefault();
                                setIsPasswordVisible(!isPasswordVisible)
                            }}>{
                                    isPasswordVisible ?
                                        <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                                        : <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>
                                }
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">Remember me for</label>
                        <select
                            onInput={(e) => { setRememberMe(e.target.value); console.log(e.target.value) }}
                            value={rememberMe} name="rememberMe" id="rememberMe" className='border-none outline-none text-sm font-bold px-2'>
                            <option className='text-xs p-1 ' value="7"> 7 Days</option>
                            <option className='text-xs p-1 ' value="15">15 Days</option>
                            <option className='text-xs p-1 ' value="30">30 Days</option>
                        </select>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
                        >Login</button>
                    </div>
                    <div className="text-center">
                        <Link to="/admin/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
                    </div>
                </form>
                <div className="mt-6 border-t border-gray-300"></div>
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">Don't have an account? <Link to="/admin/signup" className="text-blue-600 font-medium hover:underline">Sign up</Link></p>
                </div>
            </div>
        </div>
        {
            isDetailsVerified &&
            (<div className="underlay absolute z-30 top-0 left-0 h-screen w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
                <div ref={otpInputComponentRef} className="otp-container z-40 px-4 py-3  lg:w-96 sm:min-h-64 sm:max-h-[30rem] sm:rounded-2xl bg-[rgba(238,238,238,0.7)] shadow-[0px_0px_10px_0_rgba(31,38,135,0.37)] backdrop-blur-[4px] border border-[rgb(255,255,255)] ">
                    <div className="content" ref={otpInputComponentChildRef}>
                        <h1 className='text-center font-bold text-desktopBodyLarge'>Enter verification code</h1>
                        <p className='text-gray-500 px-2 py-4 text-center'>We've  sent verification code to
                            &nbsp; <b>{email}</b>
                        </p>
                        <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                            {
                                otpInputRef.map((ref, idx) => {
                                    return <input
                                        key={idx}
                                        ref={ref}
                                        onInput={(e) => handleInput(e, idx)}
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        onPaste={handlePaste}
                                        className="w-10 h-10 text-center p-1 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700" type="text" name="" id="" />
                                })
                            }
                        </div>
                        <div className="timer text-center mx-auto my-2">
                            {otpTimer &&
                                <p className='text-green-800 tracking-widest font-bold'>{otpTimer}</p>
                            }
                        </div>
                        {
                            !otpTimer &&
                            <div className="resend-code py-4 text-center">
                                <p>Did'nt get code? <button onClick={() => {
                                    handleSendOtp('email')
                                }}><b>Click to resend</b></button></p>
                            </div>
                        }
                        <div className="button-wrapper text-center pt-4 pb-2">
                            <hr className='border-1 border-gray-600 text-center mx-auto' />
                            <div className="mt-4 btn-wrapper flex item center justify-evenly">
                                <button
                                    onClick={() => {
                                        clearInterval(intervalId)
                                        setIsDetailsVerified(false);
                                    }}
                                    className=" my-2 px-8 py-2 border-gray-800 border-[1px] bg-white rounded-lg">Cancel</button>
                                <button
                                    onClick={handleVerifyEmailOtp}
                                    className="my-2 px-8 py-2 text-white border-gray-800 border-1 bg-blue-500 rounded-md">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>)
        }

    </>)
}

export default Login

import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import CodeEditor from './CodeEditor';
import ResultPanel from './ResultPanel';
import '../../App.css';
import './Layout.css';

function UserTest() {
    // ✨ 1. 'result' 상태 하나로 통합합니다.
    const [result, setResult] = useState(null);
    const { problemId } = useParams();

    // ✨ 2. problemId가 바뀔 때 통합된 'result' 상태만 초기화합니다.
    useEffect(() => {
        setResult(null);
    }, [problemId]);

    // ✨ 3. '실행'과 '제출' 결과를 모두 처리하는 단일 핸들러 함수를 만듭니다.
    const handleResultUpdate = (newResult) => {
        setResult(newResult);
    };

    return (
        <>
            <header className="usertest-user-header-test">
                <h3>AI-Security</h3>
            </header>
            
            <div className="usertest-main-container">
                <div className="usertest-left-panel">
                    <SidebarMenu />
                    <Outlet />
                </div>

                <div className="usertest-right-panel">
                    {/* ✨ 4. CodeEditor의 두 콜백에 모두 동일한 핸들러를 연결합니다. */}
                    <CodeEditor
                        onSubmit={handleResultUpdate}
                        onCodeSubmit={handleResultUpdate}
                    />
                    {/* ✨ 5. ResultPanel에는 통합된 result 상태만 깔끔하게 전달합니다. */}
                    <ResultPanel 
                        result={result} 
                        problemId={problemId} 
                    />
                </div>
            </div>
        </>
    );
}

export default UserTest;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getAllProfessors, 
    getAllStudents, 
    deleteProfessor,
    deleteStudent,
    resetProfessorPassword 
} from './ManageAPI';
import './ManageStyle.css';
import Header from '../admin/Header/Header';

const Manage = () => {
    const navigate = useNavigate();
    const [professors, setProfessors] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const professorsData = await getAllProfessors();
            const studentsData = await getAllStudents();
            setProfessors(professorsData);
            setStudents(studentsData);
        } catch (err) {
            console.error("사용자 목록을 불러오는 중 오류 발생:", err);
            setError("사용자 목록을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const handleAddProfessorClick = () => {
        navigate('/master/professor');
    };
    
    const handleResetPassword = async (e, username, name) => {
        e.stopPropagation();
        if (window.confirm(`"${name}" 교수의 비밀번호를 정말로 초기화하시겠습니까?`)) {
            try {
                await resetProfessorPassword(username);
                alert(`"${name}" 교수의 비밀번호가 성공적으로 초기화되었습니다.`);
            } catch (err) {
                console.error("비밀번호 초기화 중 오류 발생:", err);
                alert(`비밀번호 초기화에 실패했습니다: ${err.message || ''}`);
            }
        }
    };

    const handleRemoveUser = async (e, username, name, role) => {
        e.stopPropagation();
        if (window.confirm(`"${name}" 사용자를 정말로 삭제하시겠습니까?`)) {
            try {
                if (role === 'professor') {
                    await deleteProfessor(username);
                } else if (role === 'student') {
                    await deleteStudent(username);
                }
                fetchAllUsers(); // 목록 새로고침
                alert(`"${name}" 사용자가 성공적으로 삭제되었습니다.`);
            } catch (err) {
                console.error("사용자 삭제 중 오류 발생:", err);
                alert(`사용자 삭제에 실패했습니다: ${err.message || ''}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="manage-manage__loading">데이터를 불러오는 중입니다...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="manage-manage__error">오류: {error}</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Header />
            <div className="manage-manage">
                <div className="manage-manage__section">
                    <div className="manage-manage__header">
                        {/* ▼▼▼ [수정] h2와 button의 위치를 바로잡았습니다. ▼▼▼ */}
                        <h2>교수 목록</h2>
                        <button className="manage-manage__add-btn" onClick={handleAddProfessorClick}>
                            교수 추가
                        </button>
                        {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}
                    </div>
                    <ul className="manage-manage__list">
                        {professors.length > 0 ? (
                            professors.map((professor) => (
                                <li key={professor.id} className="manage-manage__item">
                                    <div className="manage-manage__item-name">{professor.name} ({professor.username})</div>
                                    <div className="manage-manage__item-actions">
                                        <button
                                            className="manage-manage__reset-btn"
                                            onClick={(e) => handleResetPassword(e, professor.username, professor.name)}
                                        >
                                            비밀번호 초기화
                                        </button>
                                        <button
                                            className="manage-manage__remove-btn"
                                            onClick={(e) => handleRemoveUser(e, professor.username, professor.name, 'professor')}
                                        >
                                            제거
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="manage-manage__no-items">등록된 교수가 없습니다.</li>
                        )}
                    </ul>
                </div>

                <div className="manage-manage__section">
                    <div className="manage-manage__header">
                        <h2>유저 목록</h2>
                    </div>
                    <ul className="manage-manage__list">
                        {students.length > 0 ? (
                            students.map((student) => (
                                <li key={student.id} className="manage-manage__item">
                                    <div className="manage-manage__item-name">{student.name} ({student.username})</div>
                                    <div className="manage-manage__item-actions">
                                        <button
                                            className="manage-manage__remove-btn"
                                            onClick={(e) => handleRemoveUser(e, student.username, student.name, 'student')}
                                        >
                                            제거
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="manage-manage__no-items">등록된 유저가 없습니다.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Manage;
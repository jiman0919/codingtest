import React, { useState, useEffect } from 'react';
import { slide as Menu } from 'react-burger-menu';
import { Link, useLocation, useParams } from 'react-router-dom';
import './SidebarMenu.css';
import { FaTimes } from 'react-icons/fa';
import { getProblemList, getSubmissionStatusForCourse } from '../../services/api';

const CustomCloseButton = () => <FaTimes size={28} color="white" />;

function SidebarMenu() {
    const pageWrapId = "page-wrap";
    const outerContainerId = "App";

    const [isOpen, setIsOpen] = useState(false);
    const [problems, setProblems] = useState([]);
    const location = useLocation();
    const { classId } = useParams();

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (classId) {
            const fetchSidebarData = async () => {
                try {
                    const [problemsData, statusesData] = await Promise.all([
                        getProblemList(classId),
                        getSubmissionStatusForCourse(classId)
                    ]);

                    const mergedProblems = problemsData.map(problem => {
                        const statusInfo = statusesData.find(status => status.problem_id === problem.id);
                        return {
                            ...problem,
                            is_submitted: statusInfo ? statusInfo.is_submitted : false,
                        };
                    });
                    
                    setProblems(mergedProblems);
                } catch (error) {
                    console.error('Error fetching sidebar data:', error);
                }
            };
            fetchSidebarData();
        }
    }, [classId]);


    const handleStateChange = (state) => {
        setIsOpen(state.isOpen);
    };

    return (
        <Menu
            pageWrapId={pageWrapId}
            outerContainerId={outerContainerId}
            customCrossIcon={<CustomCloseButton />}
            isOpen={isOpen}
            onStateChange={handleStateChange}
        >
            {problems.length > 0 ? (
                problems.map(problem => (
                    <Link
                        key={problem.id}
                        className="sidebarmenu-menu-item"
                        to={`/user/classes/${classId}/problems/${problem.id}`}
                    >
                        {problem.title}
                        {problem.is_submitted && <span className="sidebarmenu-submitted-icon">✔</span>}
                    </Link>
                ))
            ) : (
                <div className="sidebarmenu-menu-item sidebarmenu-no-problems">
                    문제가 없습니다.
                </div>
            )}
        </Menu>
    );
}

export default SidebarMenu;
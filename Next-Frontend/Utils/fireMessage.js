import Swal from 'sweetalert2';

// Shared toast helper, ported 1:1 from the old Vite app's
// Pages/Admin/Pages/AuthPage/Signup.jsx `fireMessage` export.
// Multiple verticals (Films, Home, Photos, Search) call this, so it lives
// in Utils/ as a cross-cutting helper rather than under any single page tree.
export async function fireMessage(msg, type) {
  await Swal.fire({
    toast: true,
    position: 'top-right',
    icon: type,
    title: msg,
    timer: 1500,
    timerProgressBar: true,
    showConfirmButton: false,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
}
